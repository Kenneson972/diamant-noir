export async function fetchAirbnbData(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Airbnb page: ${response.status}`);
    }

    const html = await response.text();

    // Extracting data from Meta tags (OpenGraph)
    const extractMeta = (property: string) => {
      const match = html.match(new RegExp(`<meta property="${property}" content="([^"]+)"`, 'i'));
      return match ? match[1] : null;
    };

    const title = extractMeta('og:title');
    const description = extractMeta('og:description');
    const primaryImage = extractMeta('og:image');

    let capacity = 2;

    // Try to find more images in the HTML
    // Airbnb often puts images in meta tags or script blocks
    const imageUrls: string[] = [];
    if (primaryImage) imageUrls.push(primaryImage);

    // Look for other images in the HTML (simplistic approach)
    const imgMatches = html.matchAll(/"large":"([^"]+)"/g);
    for (const match of imgMatches) {
      const url = match[1].replace(/\\u002F/g, '/');
      if (url && !imageUrls.includes(url) && url.startsWith('http')) {
        imageUrls.push(url);
      }
      if (imageUrls.length >= 50) break; // Increased limit to 50
    }

    // Secondary patterns for Airbnb images
    const additionalPatterns = [
      /"picture_url":"([^"]+)"/g,
      /"baseUrl":"([^"]+)"/g,
      /"original_content_url":"([^"]+)"/g
    ];

    for (const pattern of additionalPatterns) {
      if (imageUrls.length >= 50) break;
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1].replace(/\\u002F/g, '/');
        if (url && !imageUrls.includes(url) && url.startsWith('http') && (url.includes('muscache.com') || url.includes('airbnb.com'))) {
          // Filter out low-res thumbnails if possible
          if (!url.includes('style=') || url.includes('im_w=1200') || url.includes('im_w=720')) {
            imageUrls.push(url);
          }
        }
        if (imageUrls.length >= 50) break;
      }
    }

    // Simple regex for capacity in description like "4 guests"
    if (description) {
      const guestMatch = description.match(/(\d+)\s+(voyageurs|guests)/i);
      if (guestMatch) capacity = parseInt(guestMatch[1]);
    }

    return {
      name: title ? title.split(' - ')[0] : null,
      description: description,
      image_url: primaryImage,
      image_urls: imageUrls,
      capacity: capacity,
    };
  } catch (error) {
    console.error("Error importing from Airbnb:", error);
    throw error;
  }
}
