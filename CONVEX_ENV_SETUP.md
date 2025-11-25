# Convex Environment Variables Setup

## Quick Start

I've generated the required JWT keys for you. Follow these steps:

### Step 1: Open Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select your "utmost-gull-840" deployment (Chutney Smugglers)
3. Navigate to Settings → Environment Variables

### Step 2: Set JWT_PRIVATE_KEY

1. Click "Add Environment Variable"
2. Name: `JWT_PRIVATE_KEY`
3. Value: Open the file `jwt_private_key_multiline.txt` in this directory
4. Copy the ENTIRE contents (including the BEGIN/END lines)
5. Paste into the value field in Convex Dashboard
6. **IMPORTANT**: The newlines must be preserved - it should look like a multi-line PEM certificate, NOT a single line

### Step 3: Set JWKS

1. Click "Add Environment Variable" again
2. Name: `JWKS`
3. Value: Open the file `jwks.txt` in this directory
4. Copy the ENTIRE contents (it's a single line of JSON)
5. Paste into the value field in Convex Dashboard

The value should look like:
```json
{"keys":[{"use":"sig","kty":"RSA","n":"...long string...","e":"AQAB"}]}
```

## After Setting Both Variables

1. Save the environment variables in the Convex Dashboard
2. Wait a few seconds for the deployment to update
3. Try signing in to the app again

The authentication should now work properly!
