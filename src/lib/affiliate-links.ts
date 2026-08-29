const AMAZON_AFFILIATE_ID = process.env.AFFILIATE_AMAZON_ID || '';
const BESTBUY_AFFILIATE_ID = process.env.AFFILIATE_BESTBUY_ID || '';
const EBAY_CAMPAIGN_ID = process.env.AFFILIATE_EBAY_ID || '';

// eBay Partner Network's manual-link-building method: append these params to
// any ebay.com URL (not just item pages) to get the click tracked. mkcid,
// mkrid, siteid, toolid, and mkevt are standard EPN constants (not secrets,
// not account-specific) - campid is the only value tied to our account.
const EBAY_MKCID = '1';
const EBAY_MKRID = '711-53200-19255-0';
const EBAY_SITEID = '0';
const EBAY_TOOLID = '80004';
const EBAY_MKEVT = '1';

export type RetailerLink = {
  key: 'amazon' | 'bestbuy' | 'ebay';
  label: string;
  url: string;
};

/**
 * Retailer links are search-query links (no per-product ID mapping exists in
 * the catalog), with a configurable affiliate ID appended when one is set. A
 * retailer is omitted entirely if we don't have real tracking for it yet
 * (e.g. Best Buy, pending approval), rather than showing a non-affiliate link.
 */
export const getRetailerLinks = (deviceName: string): RetailerLink[] => {
  const query = encodeURIComponent(deviceName);
  const links: RetailerLink[] = [];

  if (AMAZON_AFFILIATE_ID) {
    links.push({
      key: 'amazon',
      label: 'Amazon',
      url: `https://www.amazon.com/s?k=${query}&tag=${encodeURIComponent(AMAZON_AFFILIATE_ID)}`,
    });
  }

  if (EBAY_CAMPAIGN_ID) {
    links.push({
      key: 'ebay',
      label: 'eBay',
      url:
        `https://www.ebay.com/sch/i.html?_nkw=${query}` +
        `&mkcid=${EBAY_MKCID}&mkrid=${EBAY_MKRID}&siteid=${EBAY_SITEID}` +
        `&toolid=${EBAY_TOOLID}&mkevt=${EBAY_MKEVT}&campid=${encodeURIComponent(EBAY_CAMPAIGN_ID)}`,
    });
  }

  if (BESTBUY_AFFILIATE_ID) {
    links.push({
      key: 'bestbuy',
      label: 'Best Buy',
      url: `https://www.bestbuy.com/site/searchpage.jsp?st=${query}&ref=${encodeURIComponent(BESTBUY_AFFILIATE_ID)}`,
    });
  }

  return links;
};
