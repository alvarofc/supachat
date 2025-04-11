interface TurnstileInstance {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback': () => void;
  }) => void;
  remove: () => void;
}

declare interface Window {
  turnstile: TurnstileInstance;
} 