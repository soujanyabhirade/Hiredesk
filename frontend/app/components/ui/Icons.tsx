"use client";

import type { SVGProps } from "react";

const iconStyle = (props: SVGProps<SVGSVGElement>) =>
  props.className ? undefined : { width: "1.75rem", height: "1.75rem" };

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <path d="M17.94 17.54c1.43-.95 2.36-2.54 2.36-4.41C20.31 11.26 18.7 10 16.75 10c-1.92 0-3.53 1.23-4.08 2.93C11.75 12.42 10.82 12 9.75 12c-2.95 0-5.25 2.3-5.25 5.13v.87h12v-.87c0-.46-.05-.92-.16-1.36z" />
      <path d="M9.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
    </svg>
  );
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 3h-4a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v6h16v-6a2 2 0 0 0-2-2h-2V5a2 2 0 0 0-2-2h-4z" />
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <rect x="3" y="5.5" width="18" height="17" rx="2" />
      <path d="M8 2v3M16 2v3M3 10h18" />
    </svg>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z" />
    </svg>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 6-6" />
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6l3 3" />
    </svg>
  );
}

export function DocumentTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <path d="M9.5 3h-1A2.5 2.5 0 0 0 6 5.5V21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a2.5 2.5 0 0 0-2.5-2.5h-1" />
      <path d="M9 10h6M9 14h6" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle(props)}
      {...props}
    >
      <path d="M12 2v4m0 16v-4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m16 0h-4" />
      <circle cx="12" cy="12" r="10" opacity={0.3} />
    </svg>
  );
}
