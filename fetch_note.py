import os, json, urllib.request, datetime
env_file = '.env'
if os.path.exists('.env.local'): env_file = '.env.local'
keys = {}
with open(env_file) as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            keys[k] = v.strip().strip("'").strip('"')

# Fetch the 3 most recently updated notes regardless of sharing
url = keys.get('NEXT_PUBLIC_SUPABASE_URL') + '/rest/v1/notes?select=title,share_slug,content&order=updated_at.desc&limit=3'
req = urllib.request.Request(url, headers={'apikey': keys.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')})
try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    if data:
        for item in data:
            print("TITLE:", item['title'])
            print("SLUG:", item['share_slug'])
            print("CONTENT:", item['content'][:500])
            print('---')
    else:
        print("NO RECENT NOTES FOUND")
except Exception as e:
    print('Failed:', e)
