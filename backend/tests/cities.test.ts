import { CITY_CODE_MAP, resolveCityInfo } from '../src/constants/cities';

describe('City Code Mapping Dictionary Test', () => {
  it('should correctly resolve SEL to Seoul, South Korea, Asia-Pacific', () => {
    const info = resolveCityInfo('SEL');
    expect(info.city).toBe('서울 (Seoul)');
    expect(info.country).toBe('대한민국 (South Korea)');
    expect(info.continent).toBe('아시아-태평양 (Asia-Pacific)');
  });

  it('should correctly resolve ICN to Incheon Songdo', () => {
    const info = resolveCityInfo('ICN');
    expect(info.city).toBe('인천 송도 (Incheon)');
    expect(info.country).toBe('대한민국 (South Korea)');
    expect(info.continent).toBe('아시아-태평양 (Asia-Pacific)');
  });

  it('should correctly resolve European and American cities (LON, NYC, MAA, OSA)', () => {
    expect(resolveCityInfo('LON').city).toBe('런던 (London)');
    expect(resolveCityInfo('LON').continent).toBe('유럽 (Europe)');

    expect(resolveCityInfo('NYC').city).toBe('뉴욕 (New York)');
    expect(resolveCityInfo('NYC').continent).toBe('북미 (North America)');

    expect(resolveCityInfo('MAA').city).toBe('마스트리흐트 (Maastricht)');
    expect(resolveCityInfo('MAA').country).toBe('네덜란드 (Netherlands)');

    expect(resolveCityInfo('OSA').city).toBe('오사카 (Osaka)');
    expect(resolveCityInfo('OSA').country).toBe('일본 (Japan)');
  });

  it('should handle unmapped city codes gracefully with fallback', () => {
    const info = resolveCityInfo('XYZ', 'continent-europe');
    expect(info.city).toBe('XYZ');
    expect(info.country).toBe('기타 (Other)');
    expect(info.continent).toBe('유럽 (Europe)');
  });

  it('should contain all 96 HYROX official cities', () => {
    const keys = Object.keys(CITY_CODE_MAP);
    expect(keys.length).toBeGreaterThanOrEqual(96);
    expect(keys).toContain('SEL');
    expect(keys).toContain('ICN');
    expect(keys).toContain('BOM');
    expect(keys).toContain('SLC');
  });
});
