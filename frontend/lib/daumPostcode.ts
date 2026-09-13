import type { DaumPostcodeData, DaumPostcodeResult } from '@/types/daum';

export type { DaumPostcodeData, DaumPostcodeResult } from '@/types/daum';

export const DAUM_POSTCODE_SCRIPT_URL = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let scriptLoadingPromise: Promise<void> | null = null;

/**
 * Loads the Daum Postcode script dynamically from Daum CDN.
 * Uses a singleton promise to prevent multiple script tag insertions.
 */
export function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Daum Postcode script can only be loaded in a browser environment'));
  }

  // If already loaded and initialized on window, resolve immediately
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  // Return active singleton promise to prevent duplicate insertions
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    // Check if script tag is already present in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${DAUM_POSTCODE_SCRIPT_URL}"]`
    );

    const handleSuccess = () => {
      if (window.daum?.Postcode) {
        resolve();
      } else {
        scriptLoadingPromise = null;
        reject(new Error('Daum Postcode script loaded, but window.daum.Postcode is undefined'));
      }
    };

    const handleError = (targetScript?: HTMLScriptElement | null) => {
      scriptLoadingPromise = null;
      if (targetScript && targetScript.parentNode) {
        targetScript.parentNode.removeChild(targetScript);
      }
      reject(new Error('Failed to load Daum Postcode script from CDN'));
    };

    if (existingScript) {
      if (window.daum?.Postcode) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', handleSuccess, { once: true });
      existingScript.addEventListener('error', () => handleError(existingScript), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = DAUM_POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = handleSuccess;
    script.onerror = () => handleError(script);

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Formats the raw Daum Postcode data into baseAddress, extraAddress, and fullAddress
 * according to the standard Daum Postcode guidelines.
 */
export function formatDaumAddress(data: DaumPostcodeData): DaumPostcodeResult {
  const baseAddress = (data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress) || data.address || '';
  let extraAddress = '';

  if (data.userSelectedType === 'R') {
    // 법정동명이 있을 경우 추가 (법정리는 제외, '동/로/가'로 끝남)
    if (data.bname && /[동|로|가]$/.test(data.bname)) {
      extraAddress += data.bname;
    }
    // 건물명이 있고 공동주택일 경우 추가
    if (data.buildingName && data.apartment === 'Y') {
      extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
    }
    // 참고 항목이 존재하면 괄호로 감싸고 선행 공백 추가
    if (extraAddress) {
      extraAddress = ` (${extraAddress})`;
    }
  }

  const fullAddress = `${baseAddress}${extraAddress}`;

  return {
    zonecode: data.zonecode,
    baseAddress,
    extraAddress,
    fullAddress,
  };
}

export interface OpenDaumPostcodePopupOptions {
  popupName?: string;
  onclose?: (state: string) => void;
}

/**
 * Loads the Daum Postcode script if not already loaded, then opens the address search popup.
 * Resolves the selected address formatted according to Daum standards.
 */
export async function openDaumPostcodePopup(
  onComplete: (result: DaumPostcodeResult) => void,
  options?: OpenDaumPostcodePopupOptions
): Promise<void> {
  await loadDaumPostcodeScript();

  if (!window.daum?.Postcode) {
    throw new Error('Daum Postcode is not available on window');
  }

  new window.daum.Postcode({
    oncomplete: (data: DaumPostcodeData) => {
      const result = formatDaumAddress(data);
      onComplete(result);
    },
    onclose: options?.onclose,
  }).open({ popupName: options?.popupName });
}
