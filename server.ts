import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = 3000;

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Viem client
const viemClient = createPublicClient({
  chain: base,
  transport: http()
});

const CHH_CONTRACT = '0xb0525542e3d818460546332e76e511562dff9b07';

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/og-image/:fid", async (req, res) => {
  try {
    const fid = req.params.fid;
    
    // Fetch user data from Supabase
    const { data: dbUserData, error: userError } = await supabase
      .from('farcaster_users')
      .select('*')
      .eq('fid', fid)
      .single();

    let userData = dbUserData;
    if (userError || !userData) {
      // Fallback to default data instead of returning 404
      userData = {
        display_name: 'Farcaster User',
        username: `user${fid}`,
        pfp_url: 'https://chihuahuaportal.k0j1.v2002.coreserver.jp/default-og.png'
      };
    }

    // Fetch scores
    const [runningRes, reversiRes, questRes] = await Promise.all([
      supabase.from('running_player_stats').select('total_score').eq('fid', fid).single(),
      supabase.from('reversi_game_stats').select('claimed_score').eq('fid', fid).single(),
      supabase.from('quest_player_stats').select('total_reward').eq('fid', fid).single()
    ]);

    const runningScore = runningRes.data?.total_score || 0;
    const reversiScore = reversiRes.data?.claimed_score || 0;
    const questScore = questRes.data?.total_reward || 0;
    const totalScore = runningScore + reversiScore + questScore;

    // Fetch CHH balance
    let chhBalance = '0';
    if (userData.custody_address) {
      try {
        const balance = await viemClient.readContract({
          address: CHH_CONTRACT as `0x${string}`,
          abi: [{
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
          }] as const,
          functionName: 'balanceOf',
          args: [userData.custody_address as `0x${string}`]
        } as any);
        
        const numericBalance = Number(balance) / 1e18;
        chhBalance = numericBalance.toFixed(2);
      } catch (e) {
        console.error('Error fetching CHH balance:', e);
      }
    }

    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const displayName = escapeHtml(userData.display_name || 'Guest');
    const username = escapeHtml(userData.username || 'guest');
    const pfpUrl = userData.pfp_url ? escapeHtml(userData.pfp_url) : '';

    // Generate SVG
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f4ecd8" />
            <stop offset="100%" stop-color="#e8dcc2" />
          </linearGradient>
          <clipPath id="avatar-clip">
            <circle cx="600" cy="200" r="80" />
          </clipPath>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1" />
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)" />
        
        <!-- Header Pattern -->
        <rect width="1200" height="120" fill="#d97736" opacity="0.1" />
        
        <!-- Content -->
        <text x="600" y="340" font-family="sans-serif" font-size="48" font-weight="bold" fill="#3e2723" text-anchor="middle">${displayName}</text>
        <text x="600" y="390" font-family="monospace" font-size="32" fill="#8d6e63" text-anchor="middle">@${username}</text>
        
        <!-- Stats Cards -->
        <g filter="url(#shadow)">
          <rect x="250" y="440" width="320" height="140" rx="16" fill="#f4ecd8" stroke="#ffffff" stroke-width="4" />
          <text x="410" y="490" font-family="sans-serif" font-size="24" font-weight="bold" fill="#8d6e63" text-anchor="middle">$CHH Balance</text>
          <text x="410" y="545" font-family="sans-serif" font-size="48" font-weight="bold" fill="#3e2723" text-anchor="middle">${parseFloat(chhBalance).toLocaleString()}</text>
        </g>
        
        <g filter="url(#shadow)">
          <rect x="630" y="440" width="320" height="140" rx="16" fill="#f4ecd8" stroke="#ffffff" stroke-width="4" />
          <text x="790" y="490" font-family="sans-serif" font-size="24" font-weight="bold" fill="#8d6e63" text-anchor="middle">Total Reward</text>
          <text x="790" y="545" font-family="sans-serif" font-size="48" font-weight="bold" fill="#d97736" text-anchor="middle">${totalScore.toLocaleString()} CHH</text>
        </g>

        <!-- Avatar -->
        <circle cx="600" cy="200" r="84" fill="#ffffff" filter="url(#shadow)" />
        ${pfpUrl ? `<image href="${pfpUrl}" x="520" y="120" width="160" height="160" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />` : `<text x="600" y="220" font-size="80" text-anchor="middle">👤</text>`}
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg.trim());
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Handle specific share routes to inject meta tags
    app.get('/share/:fid', async (req, res, next) => {
      try {
        const fid = req.params.fid;
        const url = req.originalUrl;
        
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const ogImageUrl = `${req.protocol}://${req.get('host')}/api/og-image/${fid}`;
        const shareUrl = `${req.protocol}://${req.get('host')}/share/${fid}`;
        
        const miniappEmbed = JSON.stringify({
          version: "1",
          imageUrl: ogImageUrl,
          button: {
            title: "View Status",
            action: {
              type: "launch_miniapp",
              url: shareUrl,
              name: "ChihuahuaStatus",
              splashBackgroundColor: "#f4ecd8"
            }
          }
        });
        
        const metaTags = `
          <meta property="og:title" content="ChihuahuaStatus" />
          <meta property="og:description" content="Check out my Chihuahua Status!" />
          <meta property="og:image" content="${ogImageUrl}" />
          <meta property="og:url" content="${shareUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="${ogImageUrl}" />
          <meta name="fc:miniapp" content='${miniappEmbed}' />
          <meta name="fc:frame" content='${miniappEmbed}' />
        `;
        
        const html = template
          .replace(/<meta name="fc:miniapp".*?>/g, '')
          .replace(/<meta name="fc:frame".*?>/g, '')
          .replace('</head>', `${metaTags}</head>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Handle specific share routes to inject meta tags in production
    app.get('/share/:fid', (req, res) => {
      try {
        const fid = req.params.fid;
        let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        
        const ogImageUrl = `${req.protocol}://${req.get('host')}/api/og-image/${fid}`;
        const shareUrl = `${req.protocol}://${req.get('host')}/share/${fid}`;
        
        const miniappEmbed = JSON.stringify({
          version: "1",
          imageUrl: ogImageUrl,
          button: {
            title: "View Status",
            action: {
              type: "launch_miniapp",
              url: shareUrl,
              name: "ChihuahuaStatus",
              splashBackgroundColor: "#f4ecd8"
            }
          }
        });
        
        const metaTags = `
          <meta property="og:title" content="ChihuahuaStatus" />
          <meta property="og:description" content="Check out my Chihuahua Status!" />
          <meta property="og:image" content="${ogImageUrl}" />
          <meta property="og:url" content="${shareUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="${ogImageUrl}" />
          <meta name="fc:miniapp" content='${miniappEmbed}' />
          <meta name="fc:frame" content='${miniappEmbed}' />
        `;
        
        const html = template
          .replace(/<meta name="fc:miniapp".*?>/g, '')
          .replace(/<meta name="fc:frame".*?>/g, '')
          .replace('</head>', `${metaTags}</head>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
