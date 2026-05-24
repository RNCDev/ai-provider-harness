import { Children, cloneElement, isValidElement, type ReactNode, type HTMLAttributes } from "react";

export interface SlotProps extends HTMLAttributes<HTMLElement> { children: ReactNode }

export function Slot({ children, className, ...rest }: SlotProps) {
  const child = Children.only(children);
  if (!isValidElement(child)) return <>{child}</>;
  const childProps = child.props as { className?: string } & Record<string, unknown>;
  return cloneElement(child, {
    ...rest,
    ...childProps,
    className: [className, childProps.className].filter(Boolean).join(" ") || undefined,
  });
}
