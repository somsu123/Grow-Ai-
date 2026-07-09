import { normalizeCRMStatus, normalizeDataSource, normalizeDate } from '../utils/csvHelpers';

describe('normalizeCRMStatus', () => {
  // Already valid enum values
  it('returns GOOD_LEAD_FOLLOW_UP as-is', () => {
    expect(normalizeCRMStatus('GOOD_LEAD_FOLLOW_UP')).toBe('GOOD_LEAD_FOLLOW_UP');
  });
  it('returns DID_NOT_CONNECT as-is', () => {
    expect(normalizeCRMStatus('DID_NOT_CONNECT')).toBe('DID_NOT_CONNECT');
  });
  it('returns BAD_LEAD as-is', () => {
    expect(normalizeCRMStatus('BAD_LEAD')).toBe('BAD_LEAD');
  });
  it('returns SALE_DONE as-is', () => {
    expect(normalizeCRMStatus('SALE_DONE')).toBe('SALE_DONE');
  });

  // Case insensitive
  it('handles lowercase input', () => {
    expect(normalizeCRMStatus('sale_done')).toBe('SALE_DONE');
  });

  // Fuzzy mapping
  it('maps "Hot Lead" to GOOD_LEAD_FOLLOW_UP', () => {
    expect(normalizeCRMStatus('Hot Lead')).toBe('GOOD_LEAD_FOLLOW_UP');
  });
  it('maps "HOT" to GOOD_LEAD_FOLLOW_UP', () => {
    expect(normalizeCRMStatus('HOT')).toBe('GOOD_LEAD_FOLLOW_UP');
  });
  it('maps "Warm" to GOOD_LEAD_FOLLOW_UP', () => {
    expect(normalizeCRMStatus('Warm')).toBe('GOOD_LEAD_FOLLOW_UP');
  });
  it('maps "Follow Up" to GOOD_LEAD_FOLLOW_UP', () => {
    expect(normalizeCRMStatus('Follow Up')).toBe('GOOD_LEAD_FOLLOW_UP');
  });
  it('maps "Interested" to GOOD_LEAD_FOLLOW_UP', () => {
    expect(normalizeCRMStatus('Interested')).toBe('GOOD_LEAD_FOLLOW_UP');
  });

  it('maps "Cold" to DID_NOT_CONNECT', () => {
    expect(normalizeCRMStatus('Cold')).toBe('DID_NOT_CONNECT');
  });
  it('maps "DNC" to DID_NOT_CONNECT', () => {
    expect(normalizeCRMStatus('DNC')).toBe('DID_NOT_CONNECT');
  });
  it('maps "Callback Requested" to DID_NOT_CONNECT', () => {
    expect(normalizeCRMStatus('Callback Requested')).toBe('DID_NOT_CONNECT');
  });
  it('maps "No Answer" to DID_NOT_CONNECT', () => {
    expect(normalizeCRMStatus('No Answer')).toBe('DID_NOT_CONNECT');
  });

  it('maps "Not Interested" to BAD_LEAD', () => {
    expect(normalizeCRMStatus('Not Interested')).toBe('BAD_LEAD');
  });
  it('maps "Cold Lead" to BAD_LEAD', () => {
    expect(normalizeCRMStatus('Cold Lead')).toBe('BAD_LEAD');
  });
  it('maps "Rejected" to BAD_LEAD', () => {
    expect(normalizeCRMStatus('Rejected')).toBe('BAD_LEAD');
  });
  it('maps "Lost" to BAD_LEAD', () => {
    expect(normalizeCRMStatus('Lost')).toBe('BAD_LEAD');
  });

  it('maps "Deal Closed" to SALE_DONE', () => {
    expect(normalizeCRMStatus('Deal Closed')).toBe('SALE_DONE');
  });
  it('maps "Booked" to SALE_DONE', () => {
    expect(normalizeCRMStatus('Booked')).toBe('SALE_DONE');
  });
  it('maps "Converted" to SALE_DONE', () => {
    expect(normalizeCRMStatus('Converted')).toBe('SALE_DONE');
  });
  it('maps "Closed Won" to SALE_DONE', () => {
    expect(normalizeCRMStatus('Closed Won')).toBe('SALE_DONE');
  });

  // Unknown / empty
  it('returns empty string for unknown status', () => {
    expect(normalizeCRMStatus('Something Random')).toBe('');
  });
  it('returns empty string for empty input', () => {
    expect(normalizeCRMStatus('')).toBe('');
  });
});

describe('normalizeDataSource', () => {
  // Exact enum values
  it('returns leads_on_demand as-is', () => {
    expect(normalizeDataSource('leads_on_demand')).toBe('leads_on_demand');
  });
  it('returns meridian_tower as-is', () => {
    expect(normalizeDataSource('meridian_tower')).toBe('meridian_tower');
  });
  it('returns eden_park as-is', () => {
    expect(normalizeDataSource('eden_park')).toBe('eden_park');
  });
  it('returns varah_swamy as-is', () => {
    expect(normalizeDataSource('varah_swamy')).toBe('varah_swamy');
  });
  it('returns sarjapur_plots as-is', () => {
    expect(normalizeDataSource('sarjapur_plots')).toBe('sarjapur_plots');
  });

  // Fuzzy mapping
  it('maps "Meridian Tower" to meridian_tower', () => {
    expect(normalizeDataSource('Meridian Tower')).toBe('meridian_tower');
  });
  it('maps "Eden Park" to eden_park', () => {
    expect(normalizeDataSource('Eden Park')).toBe('eden_park');
  });
  it('maps "Sarjapur Plots" to sarjapur_plots', () => {
    expect(normalizeDataSource('Sarjapur Plots')).toBe('sarjapur_plots');
  });
  it('maps "Varah Swamy" to varah_swamy', () => {
    expect(normalizeDataSource('Varah Swamy')).toBe('varah_swamy');
  });
  it('maps "Leads On Demand" to leads_on_demand', () => {
    expect(normalizeDataSource('Leads On Demand')).toBe('leads_on_demand');
  });

  it('returns empty string for unknown source', () => {
    expect(normalizeDataSource('Facebook Ads')).toBe('');
  });
  it('returns empty string for empty input', () => {
    expect(normalizeDataSource('')).toBe('');
  });
});

describe('normalizeDate', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeDate('')).toBe('');
  });

  it('parses ISO date string', () => {
    const result = normalizeDate('2026-05-13');
    expect(new Date(result).getFullYear()).toBe(2026);
    expect(new Date(result).getMonth()).toBe(4); // May = 4
  });

  it('parses datetime string', () => {
    const result = normalizeDate('2026-05-13 14:20:48');
    expect(new Date(result).getFullYear()).toBe(2026);
  });

  it('parses YYYY/MM/DD format', () => {
    const result = normalizeDate('2026/05/13');
    expect(new Date(result).getFullYear()).toBe(2026);
  });

  it('returns input string if unparseable', () => {
    const result = normalizeDate('not-a-date');
    expect(result).toBe('not-a-date');
  });
});
