/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { jest } from '@jest/globals';

const chalk = {
  green: jest.fn((str: string) => str),
  yellow: jest.fn((str: string) => str),
  red: jest.fn((str: string) => str),
  blue: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
  white: jest.fn((str: string) => str)
};

export default chalk;
