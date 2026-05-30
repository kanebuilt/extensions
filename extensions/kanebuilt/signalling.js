// Name: Signalling
// ID: kbSignalling
// Description: The signal-based alternative to Scratch broadcasts. Bring IPC-like communication to your Scratch projects.
// By: KaneBuilt <https://github.com/kanebuilt>
// License: LGPL-2.1-only

// Version: 1.2.0

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('The Signalling extension must be run unsandboxed.');
  }

  // Unified state management to track active action and check signals
  const pendingSignals = new Map();
  let signalIdCounter = 0;

  class SignallingExtension {
    constructor() {
      this._currentSignal = null;

      // Monitor threads at the end of every frame execution loop
      Scratch.vm.runtime.on('AFTER_EXECUTE', () => {
        if (pendingSignals.size === 0) return;
        const activeThreads = new Set(Scratch.vm.runtime.threads);

        for (const [signalId, info] of pendingSignals.entries()) {
          info.threads = info.threads.filter((t) => activeThreads.has(t));

          // If all threads spawned by this specific signal have completed naturally
          if (info.threads.length === 0) {
            if (info.type === 'check') {
              info.resolve(''); // Check blocks default to an empty string if no explicit return
            } else {
              info.resolve(); // Action blocks simply finish executing and move to the next block
            }
            pendingSignals.delete(signalId);
          }
        }
      });
    }

    _stopPendingSignal(pending) {
      if (!pending) return;

      for (const thread of pending.threads) {
        if (thread && typeof thread.stopThisScript === 'function') {
          thread.stopThisScript();
        }
      }
    }

    getInfo() {
      return {
        id: 'kbSignalling',
        name: 'Signalling',
        color1: '#8A2BE2',
        blocks: [
          {
            opcode: 'sendAction',
            blockType: Scratch.BlockType.COMMAND,
            text: 'send action [HEADER] with [CONTENT]',
            arguments: {
              HEADER: { type: Scratch.ArgumentType.STRING, defaultValue: 'removeSprite' },
              CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: '{}' },
            },
          },
          {
            opcode: 'sendCheck',
            blockType: Scratch.BlockType.REPORTER,
            text: 'send check [HEADER] with [CONTENT]',
            arguments: {
              HEADER: { type: Scratch.ArgumentType.STRING, defaultValue: 'getFile' },
              CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'config.json' },
            },
          },
          '---',
          {
            opcode: 'whenSignal',
            blockType: Scratch.BlockType.HAT,
            text: 'when signal [HEADER] received',
            isEdgeActivated: false,
            arguments: {
              HEADER: { type: Scratch.ArgumentType.STRING, defaultValue: 'getFile' },
            },
          },
          {
            opcode: 'whenAnySignal',
            blockType: Scratch.BlockType.HAT,
            text: 'when any signal received',
            isEdgeActivated: false,
          },
          {
            opcode: 'signalHeader',
            blockType: Scratch.BlockType.REPORTER,
            text: 'signal header',
          },
          {
            opcode: 'signalContent',
            blockType: Scratch.BlockType.REPORTER,
            text: 'signal content',
          },
          {
            opcode: 'signalSender',
            blockType: Scratch.BlockType.REPORTER,
            text: 'signal sender',
          },
          '---',
          {
            opcode: 'returnSignal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'return [VALUE]',
            isTerminal: true,
            arguments: {
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'success' },
            },
          },
          {
            opcode: 'throwError',
            blockType: Scratch.BlockType.COMMAND,
            text: 'throw error [ERROR]',
            isTerminal: true,
            arguments: {
              ERROR: { type: Scratch.ArgumentType.STRING, defaultValue: 'File not found' },
            },
          },
        ],
      };
    }

    sendAction(args, util) {
      return new Promise((resolve, reject) => {
        const signalId = ++signalIdCounter;
        pendingSignals.set(signalId, {
          type: 'action',
          threads: [],
          resolve,
          reject,
          callerThread: util.thread,
        });

        this._currentSignal = {
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
          signalId: signalId,
        };

        // Start both specific and generic hat blocks
        const specificThreads = util.startHats('kbSignalling_whenSignal', {});
        const anyThreads = util.startHats('kbSignalling_whenAnySignal', {});
        const threads = specificThreads.concat(anyThreads);

        this._currentSignal = null;

        if (threads.length === 0) {
          pendingSignals.delete(signalId);
          resolve();
          return;
        }

        // Store references to the active threads to monitor them during AFTER_EXECUTE
        pendingSignals.get(signalId).threads = threads;
      });
    }

    sendCheck(args, util) {
      return new Promise((resolve, reject) => {
        const signalId = ++signalIdCounter;
        pendingSignals.set(signalId, {
          type: 'check',
          threads: [],
          resolve,
          reject,
          callerThread: util.thread,
        });

        this._currentSignal = {
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
          signalId: signalId,
        };

        // Start both specific and generic hat blocks
        const specificThreads = util.startHats('kbSignalling_whenSignal', {});
        const anyThreads = util.startHats('kbSignalling_whenAnySignal', {});
        const threads = specificThreads.concat(anyThreads);

        this._currentSignal = null;

        if (threads.length === 0) {
          pendingSignals.delete(signalId);
          resolve('');
          return;
        }

        // Store references to the active threads to monitor them during AFTER_EXECUTE
        pendingSignals.get(signalId).threads = threads;
      });
    }

    whenSignal(args, util) {
      if (!this._currentSignal) return false;
      if (args.HEADER !== this._currentSignal.header) return false;

      util.thread.__signallingContext = {
        header: this._currentSignal.header, // Added header to context
        content: this._currentSignal.content,
        sender: this._currentSignal.sender,
        signalId: this._currentSignal.signalId,
      };

      return true;
    }

    whenAnySignal(args, util) {
      if (!this._currentSignal) return false;

      util.thread.__signallingContext = {
        header: this._currentSignal.header,
        content: this._currentSignal.content,
        sender: this._currentSignal.sender,
        signalId: this._currentSignal.signalId,
      };

      return true;
    }

    signalHeader(args, util) {
      return util.thread.__signallingContext ? util.thread.__signallingContext.header : '';
    }

    signalContent(args, util) {
      return util.thread.__signallingContext ? util.thread.__signallingContext.content : '';
    }

    signalSender(args, util) {
      return util.thread.__signallingContext ? util.thread.__signallingContext.sender : '';
    }

    returnSignal(args, util) {
      const ctx = util.thread.__signallingContext;
      if (ctx && ctx.signalId) {
        const pending = pendingSignals.get(ctx.signalId);
        if (pending) {
          this._stopPendingSignal(pending);
          // Action blocks just resolve early with nothing, check blocks resolve early with the value
          pending.resolve(pending.type === 'check' ? args.VALUE : undefined);
          pendingSignals.delete(ctx.signalId);
        }
      }
    }

    throwError(args, util) {
      const ctx = util.thread.__signallingContext;
      if (ctx && ctx.signalId) {
        const pending = pendingSignals.get(ctx.signalId);
        if (pending) {
          this._stopPendingSignal(pending);
          const errorOutput = JSON.stringify({ error: args.ERROR });
          pending.reject(errorOutput);
          pendingSignals.delete(ctx.signalId);
        }
      }
    }
  }

  Scratch.extensions.register(new SignallingExtension());
})(Scratch);
