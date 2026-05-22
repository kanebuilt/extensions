// Name: Signalling
// ID: kbSignalling
// Description: The signal-based alternative to Scratch broadcasts. Bring IPC-like communication to your Scratch projects.
// By: KaneBuilt <https://github.com/kanebuilt>
// License: LGPL-2.1-only

// Version: 0.2.1

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Signalling must be run unsandboxed.');
  }

  class SignallingExtension {
    constructor() {
      // Use a WeakMap to map Scratch threads to their signals
      this.threadContexts = new WeakMap();
      this.currentSignal = null;

      // Global state for error tracking
      this.lastActionFailed = false;
      this.lastError = '';
    }

    getInfo() {
      return {
        id: 'kbSignalling',
        name: 'Signalling',
        color1: '#9C27B0',
        blocks: [
          {
            opcode: 'sendAction',
            blockType: Scratch.BlockType.COMMAND,
            text: 'send action to [TARGET] header: [HEADER] content: [CONTENT]',
            arguments: {
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targetsMenu',
                defaultValue: 'Sprite1',
              },
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'getFile',
              },
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"file": "test.txt"}',
              },
            },
          },
          {
            opcode: 'sendCheck',
            blockType: Scratch.BlockType.REPORTER,
            text: 'send check to [TARGET] header: [HEADER] content: [CONTENT]',
            arguments: {
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targetsMenu',
                defaultValue: 'Sprite1',
              },
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'getUser',
              },
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"id": 123}',
              },
            },
          },
          '---',
          {
            opcode: 'onSignal',
            blockType: Scratch.BlockType.HAT,
            text: 'when I receive signal [HEADER]',
            isEdgeActivated: false,
            shouldRestartExistingThreads: true,
            arguments: {
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'getFile',
              },
            },
          },
          {
            opcode: 'getSignalContent',
            blockType: Scratch.BlockType.REPORTER,
            text: 'signal content',
            disableMonitor: true,
          },
          {
            opcode: 'getSignalSender',
            blockType: Scratch.BlockType.REPORTER,
            text: 'signal sender',
            disableMonitor: true,
          },
          {
            opcode: 'returnSignal',
            blockType: Scratch.BlockType.COMMAND,
            isTerminal: true,
            text: 'return [VALUE]',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'success',
              },
            },
          },
          {
            opcode: 'throwError',
            blockType: Scratch.BlockType.COMMAND,
            isTerminal: true,
            text: 'throw error [ERROR]',
            arguments: {
              ERROR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'File not found',
              },
            },
          },
          '---',
          {
            opcode: 'didLastActionFail',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'did last action fail?',
          },
          {
            opcode: 'getLastError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'last error',
          },
        ],
        menus: {
          targetsMenu: {
            acceptReporters: true,
            items: '_getTargets',
          },
        },
      };
    }

    _getTargets() {
      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        // Include original sprites and the stage (exclude clones)
        if (target.isOriginal) {
          spriteNames.push(target.getName());
        }
      }
      if (spriteNames.length === 0) {
        return ['any', 'Sprite1'];
      }
      // Add an 'any' option for broadcasting to all
      spriteNames.unshift('any');
      return spriteNames;
    }

    onSignal(args, util) {
      // If currentSignal is null, the user clicked the hat block directly to test it.
      if (!this.currentSignal) {
        return true;
      }

      // Match the header payload
      if (Scratch.Cast.toString(args.HEADER) !== Scratch.Cast.toString(this.currentSignal.header)) {
        return false;
      }

      // Match the target payload
      const targetName = this.currentSignal.targetName;
      if (targetName === 'any') {
        return true;
      }

      return util.target.getName() === targetName || util.target.sprite.name === targetName;
    }

    sendAction(args, util) {
      const targetName = args.TARGET;
      const header = args.HEADER;
      const content = args.CONTENT;
      const senderName = util.target.getName();

      // Reset error state for the new action
      this.lastActionFailed = false;
      this.lastError = '';

      return new Promise((resolve) => {
        this.currentSignal = { header, targetName };
        const threadsStarted = util.startHats('kbSignalling_onSignal');
        this.currentSignal = null;

        // If no targets were listening, resolve instantly
        if (threadsStarted.length === 0) {
          resolve();
          return;
        }

        let isResolved = false;
        const customResolve = () => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        };

        for (const thread of threadsStarted) {
          this.threadContexts.set(thread, {
            content: content,
            sender: senderName,
            resolve: customResolve,
          });
        }

        // Poll threads to see if they've finished
        const checkDone = setInterval(() => {
          if (isResolved) {
            clearInterval(checkDone);
            return;
          }

          // A highly robust check: look for STATUS_DONE (4) OR if the VM dropped the thread completely.
          const anyAlive = threadsStarted.some((t) => {
            if (t.status === 4) return false;
            if (Scratch.vm.runtime.threads.indexOf(t) === -1) return false;
            return true;
          });

          // If all threads finish naturally or get dropped, resolve
          if (!anyAlive) {
            clearInterval(checkDone);
            customResolve();
          }
        }, 1000 / 30);
      });
    }

    sendCheck(args, util) {
      const targetName = args.TARGET;
      const header = args.HEADER;
      const content = args.CONTENT;
      const senderName = util.target.getName();

      // Reset error state for the new check
      this.lastActionFailed = false;
      this.lastError = '';

      return new Promise((resolve) => {
        this.currentSignal = { header, targetName };
        const threadsStarted = util.startHats('kbSignalling_onSignal');
        this.currentSignal = null;

        // If no targets were listening, return an empty string instantly
        if (threadsStarted.length === 0) {
          resolve('');
          return;
        }

        let isResolved = false;
        const customResolve = (val) => {
          if (!isResolved) {
            isResolved = true;
            resolve(val);
          }
        };

        for (const thread of threadsStarted) {
          this.threadContexts.set(thread, {
            content: content,
            sender: senderName,
            resolve: customResolve,
          });
        }

        // Poll threads to see if they've finished without calling 'return'
        const checkDone = setInterval(() => {
          if (isResolved) {
            clearInterval(checkDone);
            return;
          }

          // A highly robust check: look for STATUS_DONE (4) OR if the VM dropped the thread completely.
          const anyAlive = threadsStarted.some((t) => {
            if (t.status === 4) return false;
            if (Scratch.vm.runtime.threads.indexOf(t) === -1) return false;
            return true;
          });

          // If all threads finish naturally or get dropped, default to an empty string
          if (!anyAlive) {
            clearInterval(checkDone);
            customResolve('');
          }
        }, 1000 / 30);
      });
    }

    getSignalContent(args, util) {
      const ctx = this.threadContexts.get(util.thread);
      return ctx ? ctx.content : '';
    }

    getSignalSender(args, util) {
      const ctx = this.threadContexts.get(util.thread);
      return ctx ? ctx.sender : '';
    }

    returnSignal(args, util) {
      const ctx = this.threadContexts.get(util.thread);
      if (ctx && ctx.resolve) {
        ctx.resolve(Scratch.Cast.toString(args.VALUE));
      }

      util.thread.status = 4; // STATUS_DONE
    }

    throwError(args, util) {
      this.lastActionFailed = true;
      this.lastError = Scratch.Cast.toString(args.ERROR);

      const ctx = this.threadContexts.get(util.thread);
      if (ctx && ctx.resolve) {
        // Automatically returns empty string to unfreeze the sending check block
        ctx.resolve('');
      }

      util.thread.status = 4; // STATUS_DONE
    }

    didLastActionFail() {
      return this.lastActionFailed;
    }

    getLastError() {
      return this.lastError;
    }
  }

  Scratch.extensions.register(new SignallingExtension());
})(Scratch);
