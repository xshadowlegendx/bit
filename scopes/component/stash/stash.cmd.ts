// eslint-disable-next-line max-classes-per-file
import chalk from 'chalk';
import { MergeStrategy } from '@teambit/legacy/dist/consumer/versions-ops/merge-version';
import { Command, CommandOptions } from '@teambit/cli';
import { CheckoutProps } from '@teambit/checkout';
import { COMPONENT_PATTERN_HELP } from '@teambit/legacy/dist/constants';
import { BitError } from '@teambit/bit-error';
import { StashMain } from './stash.main.runtime';

export class StashSaveCmd implements Command {
  name = 'save';
  description = 'stash modified components';
  group = 'development';
  options = [
    ['p', 'pattern', COMPONENT_PATTERN_HELP],
    ['m', 'message <string>', 'message to be attached to the stashed components'],
  ] as CommandOptions;
  loader = true;

  constructor(private stash: StashMain) {}

  async report(
    _arg: any,
    {
      pattern,
      message,
    }: {
      pattern?: string;
      message?: string;
    }
  ) {
    const compIds = await this.stash.save({ pattern, message });
    return chalk.green(`stashed ${compIds.length} components`);
  }
}

type StashLoadOpts = {
  autoMergeResolve?: MergeStrategy;
  manual?: boolean;
  forceOurs?: boolean;
  forceTheirs?: boolean;
};

export class StashLoadCmd implements Command {
  name = 'load';
  description = 'load latest stash, checkout components and delete stash';
  group = 'development';
  options = [
    [
      '',
      'auto-merge-resolve <merge-strategy>',
      'in case of merge conflict, resolve according to the provided strategy: [ours, theirs, manual]',
    ],
    [
      '',
      'manual',
      'same as "--auto-merge-resolve manual". in case of merge conflict, write the files with the conflict markers',
    ],
    ['', 'force-ours', 'do not merge, preserve local files as is'],
    ['', 'force-theirs', 'do not merge, just overwrite with incoming files'],
  ] as CommandOptions;
  loader = true;

  constructor(private stash: StashMain) {}

  async report(_arg, { autoMergeResolve, forceOurs, forceTheirs, manual }: StashLoadOpts) {
    if (forceOurs && forceTheirs) {
      throw new BitError('please use either --force-ours or --force-theirs, not both');
    }
    if (
      autoMergeResolve &&
      autoMergeResolve !== 'ours' &&
      autoMergeResolve !== 'theirs' &&
      autoMergeResolve !== 'manual'
    ) {
      throw new BitError('--auto-merge-resolve must be one of the following: [ours, theirs, manual]');
    }
    if (manual) autoMergeResolve = 'manual';

    const checkoutProps: CheckoutProps = {
      mergeStrategy: autoMergeResolve,
      forceOurs,
      forceTheirs,
    };
    const compIds = await this.stash.loadLatest(checkoutProps);
    return chalk.green(`checked out ${compIds.length} components according to the latest stash`);
  }
}

export class StashCmd implements Command {
  name = 'stash [sub-command]';
  description = 'EXPERIMENTAL (more like a POC). stash modified components';
  group = 'development';
  options = [
    ['p', 'pattern', COMPONENT_PATTERN_HELP],
    ['m', 'message <string>', 'message to be attached to the stashed components'],
  ] as CommandOptions;
  loader = true;
  commands: Command[] = [];

  constructor(private stash: StashMain) {}

  async report(
    _arg: any,
    {
      pattern,
      message,
    }: {
      pattern?: string;
      message?: string;
    }
  ) {
    return new StashSaveCmd(this.stash).report(undefined, { pattern, message });
  }
}
