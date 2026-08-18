export async function createOrUpdateGistSubscription(
  token: string,
  gistId: string | null,
  filename: string,
  content: string,
  description: string = 'CF-Optimizor Live Updatable Subscription'
): Promise<{ gistId: string; rawUrl: string }> {
  const cleanToken = token.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  if (cleanToken) {
    headers.Authorization = `token ${cleanToken}`;
  }

  const payload: any = {
    description,
    public: true,
    files: {
      [filename]: {
        content
      }
    }
  };

  // If updating existing Gist
  if (gistId && cleanToken) {
    const updateRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    if (!updateRes.ok) {
      throw new Error(`خطا در بروزرسانی Gist (کد ${updateRes.status})`);
    }
    const data = await updateRes.json();
    return {
      gistId: data.id,
      rawUrl: data.files[filename]?.raw_url || `https://gist.githubusercontent.com/raw/${data.id}/${filename}`
    };
  }

  // If creating new Gist
  const createRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.message || `خطا در ساخت Gist (کد ${createRes.status})`);
  }

  const data = await createRes.json();
  return {
    gistId: data.id,
    rawUrl: data.files[filename]?.raw_url || `https://gist.githubusercontent.com/raw/${data.id}/${filename}`
  };
}
