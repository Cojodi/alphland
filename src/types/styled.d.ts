import "styled-components";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "styled-components" {
  export interface StyledComponentBase<
    C extends string | React.ComponentType<any>,
    T extends object,
    O extends object = {},
    A extends keyof any = never,
  > extends React.ForwardRefExoticComponent<any> {}
}
