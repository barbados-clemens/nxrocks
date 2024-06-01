import { joinPathFragments, logger } from '@nx/devkit';
import { mocked } from 'jest-mock';

import { formatCheckExecutor } from './executor';
import { FormatCheckExecutorOptions } from './schema';
import { NX_MICRONAUT_PKG } from '../../index';
import {
  GRADLE_WRAPPER_EXECUTABLE,
  MAVEN_WRAPPER_EXECUTABLE_LEGACY,
  getGradleWrapperFiles,
  getMavenWrapperFiles,
} from '@nxrocks/common-jvm';
import {
  expectExecutorCommandRanWith,
  mockExecutorContext,
} from '@nxrocks/common-jvm/testing';

//first, we mock
jest.mock('child_process');
jest.mock('@nx/workspace/src/utilities/fileutils');

//then, we import
import * as fsUtility from '@nx/workspace/src/utilities/fileutils';
import * as cp from 'child_process';
import { PathLike } from 'fs';

const mockContext = mockExecutorContext(NX_MICRONAUT_PKG, 'check-format');
const options: FormatCheckExecutorOptions = {
  root: 'mnapp',
};

describe('Format Check Executor', () => {
  beforeEach(async () => {
    jest.spyOn(logger, 'info');
    jest.spyOn(cp, 'execSync');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each`
    ignoreWrapper | buildSystem | buildFile         | execute
    ${true}       | ${'maven'}  | ${'pom.xml'}      | ${'mvn spotless:check '}
    ${true}       | ${'gradle'} | ${'build.gradle'} | ${'gradle spotlessCheck '}
    ${false}      | ${'maven'}  | ${'pom.xml'}      | ${MAVEN_WRAPPER_EXECUTABLE_LEGACY + ' spotless:check '}
    ${false}      | ${'gradle'} | ${'build.gradle'} | ${GRADLE_WRAPPER_EXECUTABLE + ' spotlessCheck '}
  `(
    'should execute a $buildSystem format check and ignoring wrapper : $ignoreWrapper',
    async ({ ignoreWrapper, buildSystem, buildFile, execute }) => {
      const files = [
        buildFile as string,
        ...(buildSystem === 'maven'
          ? getMavenWrapperFiles()
          : getGradleWrapperFiles()),
      ];
      mocked(fsUtility.fileExists).mockImplementation((filePath: PathLike) =>
        files.some((f) => joinPathFragments(filePath.toString()).endsWith(f))
      );

      await formatCheckExecutor({ ...options, ignoreWrapper }, mockContext);

      expectExecutorCommandRanWith(execute, mockContext, options);
    }
  );
});
