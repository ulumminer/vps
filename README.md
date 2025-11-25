# MikroTik Monitor - Render.com

Monitor MikroTik RouterOS system resources via Render.com + Cloudflare Workers.

## Quick Deploy to Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com)
3. Create New Web Service
4. Connect your GitHub repo
5. Deploy!

## Environment

- Node.js 18+
- Express.js
- node-routeros

## Endpoints

- GET `/` - Health check
- POST `/api/mikrotik` - MikroTik API proxy

## MikroTik Configuration

```
/ip service enable api
/ip service set api port=8728
```

## License

MIT
