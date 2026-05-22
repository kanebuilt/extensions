// Name: Comment Blocks
// ID: kbCommentBlocks
// Description: Turns Scratch's standard commenting system into blocks.
// By: KaneBuilt <https://github.com/kanebuilt>
// Original: LilyMakesThings
// License: LGPL-2.1-only

// Version: 0.1.0

(function (Scratch) {
  'use strict';

  class CommentBlocksExtension {
    getInfo() {
      return {
        id: 'kbCommentBlocks',
        name: Scratch.translate('Comment Blocks'),
        color1: '#586d84',
        blocks: [
          {
            opcode: 'commentHat',
            blockType: Scratch.BlockType.HAT,
            text: 'comment: [COMMENT]',
            isEdgeActivated: false,
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Comment',
              },
            },
          },
          {
            opcode: 'commentCommand',
            blockType: Scratch.BlockType.COMMAND,
            text: 'comment: [COMMENT]',
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Comment',
              },
            },
          },
          {
            opcode: 'commentC',
            blockType: Scratch.BlockType.CONDITIONAL,
            text: 'comment: [COMMENT]',
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Comment',
              },
            },
          },
          {
            opcode: 'commentOutC',
            blockType: Scratch.BlockType.CONDITIONAL,
            text: 'comment out with reason: [COMMENT]',
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Reason',
              },
            },
          },
          {
            opcode: 'commentReporter',
            blockType: Scratch.BlockType.REPORTER,
            text: '[INPUT] comment: [COMMENT]',
            allowDropAnywhere: true,
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Comment',
              },
              INPUT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '',
              },
            },
          },
          {
            opcode: 'commentBoolean',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[INPUT] comment [COMMENT]',
            arguments: {
              COMMENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Comment',
              },
              INPUT: {
                type: Scratch.ArgumentType.BOOLEAN,
              },
            },
          },
        ],
      };
    }

    commentHat() {
      // no-op
    }

    commentCommand() {
      // no-op
    }

    commentC() {
      return true;
    }

    commentOutC() {
      return false;
    }

    commentReporter(args) {
      return args.INPUT;
    }

    commentBoolean(args) {
      return args.INPUT || false;
    }
  }
  Scratch.extensions.register(new CommentBlocksExtension());
})(Scratch);
