/**
 * Navigation related types
 */

export type Screen =
  | 'welcome'
  | 'account'
  | 'buySubscription'
  | 'installSetup'
  | 'installOnThisDevice'
  | 'addSubscription'
  | 'congratulations'
  | 'support'
  | 'ticketDetail';

export type ScreenHistory = Screen[];

