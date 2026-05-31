export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const breakpointClasses = {
  hideBelow: {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden',
  },
  showAbove: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  },
} as const;

export const responsiveGridClasses = {
  autoCols: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  mobileFirst: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  largeDesktop: 'xl:grid-cols-4',
} as const;

export const responsiveSpacingClasses = {
  sectionPadding: 'py-4 px-4 md:py-6 md:px-6 lg:py-8 lg:px-8',
  cardPadding: 'p-3 md:p-4 lg:p-6',
  gap: 'gap-2 md:gap-4 lg:gap-6',
} as const;

export const responsiveTextClasses = {
  heading: 'text-lg md:text-xl lg:text-2xl font-bold',
  subheading: 'text-base md:text-lg lg:text-xl font-semibold',
  body: 'text-sm md:text-base',
  caption: 'text-xs md:text-sm',
} as const;

export const responsiveButtonClasses = {
  base: 'px-4 py-2 rounded-lg font-medium transition-all duration-200',
  sizes: {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  },
  fullWidth: 'w-full',
} as const;

export const responsiveCardClasses = {
  base: 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6',
  hover: 'hover:shadow-lg transition-shadow duration-200',
  border: 'border border-gray-200 dark:border-gray-700',
} as const;

export function getResponsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string,
  largeDesktop?: string
): string {
  return [
    mobile,
    tablet ? `md:${tablet}` : '',
    desktop ? `lg:${desktop}` : '',
    largeDesktop ? `xl:${largeDesktop}` : '',
  ].filter(Boolean).join(' ');
}

export function isMobile(width: number): boolean {
  return width < parseInt(breakpoints.md);
}

export function isTablet(width: number): boolean {
  return width >= parseInt(breakpoints.md) && width < parseInt(breakpoints.lg);
}

export function isDesktop(width: number): boolean {
  return width >= parseInt(breakpoints.lg);
}

export function isLargeDesktop(width: number): boolean {
  return width >= parseInt(breakpoints.xl);
}

export const touchFriendlyClasses = {
  inputMinHeight: 'min-h-[44px]',
  buttonMinHeight: 'min-h-[44px]',
  checkboxSize: 'w-5 h-5',
  radioSize: 'w-5 h-5',
} as const;
