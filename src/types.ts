/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConcernItem {
  id: string;
  iconName: string;
  title: string;
  question: string;
}

export interface ReasonItem {
  number: string;
  iconName: string;
  title: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  avatarUrl: string;
  tag: string;
  age: string;
  status: string;
  quote: string;
}

export interface JobFactItem {
  id: string;
  iconName: string;
  title: string;
  highlight: string[];
}

export interface FlowStep {
  number: string;
  title: string;
}
