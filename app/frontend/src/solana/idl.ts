export const PREDICTION_MARKET_IDL = {
  "address": "PjG6i92qPk5hpFhmNBd1RWuPt3keH9xBSqn46dc4b5w",
  "metadata": {
    "name": "prediction_market",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim_winning",
      "discriminator": [
        72,
        152,
        171,
        92,
        123,
        244,
        179,
        127
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.creator",
                "account": "Market"
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "Market"
              }
            ]
          }
        },
        {
          "name": "user_position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "create_market",
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "market_id"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "market_id",
          "type": "u64"
        },
        {
          "name": "question",
          "type": "string"
        },
        {
          "name": "resolution_time",
          "type": "i64"
        }
      ]
    },
    {
      "name": "place_bet",
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "user_position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bet_yes",
          "type": "bool"
        }
      ]
    },
    {
      "name": "resolve_market",
      "discriminator": [
        155,
        23,
        80,
        173,
        46,
        74,
        23,
        239
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "UserPosition",
      "discriminator": [
        251,
        248,
        209,
        245,
        83,
        234,
        17,
        27
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ResolutionTimeInPast",
      "msg": "Resolution time must be in the future"
    },
    {
      "code": 6001,
      "name": "BettingClosed",
      "msg": "Betting is closed for this market"
    },
    {
      "code": 6002,
      "name": "InvalidBetAmount",
      "msg": "Bet amount must be greater than zero"
    },
    {
      "code": 6003,
      "name": "ResolutionTooEarly",
      "msg": "Market cannot be resolved yet"
    },
    {
      "code": 6004,
      "name": "AlreadyResolved",
      "msg": "Market has already been resolved"
    },
    {
      "code": 6005,
      "name": "NotResolved",
      "msg": "Market has not been resolved yet"
    },
    {
      "code": 6006,
      "name": "AlreadyClaimed",
      "msg": "Winnings have already been claimed"
    },
    {
      "code": 6007,
      "name": "NoWinnings",
      "msg": "No winnings to claim"
    },
    {
      "code": 6008,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "Market",
      "docs": [
        "Market account storing prediction market state"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "docs": [
              "Creator who can resolve the market"
            ],
            "type": "pubkey"
          },
          {
            "name": "market_id",
            "docs": [
              "Unique market ID (per creator)"
            ],
            "type": "u64"
          },
          {
            "name": "question",
            "docs": [
              "The prediction question"
            ],
            "type": "string"
          },
          {
            "name": "resolution_time",
            "docs": [
              "Unix timestamp when betting closes and resolution can occur"
            ],
            "type": "i64"
          },
          {
            "name": "yes_pool",
            "docs": [
              "Total lamports bet on YES"
            ],
            "type": "u64"
          },
          {
            "name": "no_pool",
            "docs": [
              "Total lamports bet on NO"
            ],
            "type": "u64"
          },
          {
            "name": "resolved",
            "docs": [
              "Whether the market has been resolved"
            ],
            "type": "bool"
          },
          {
            "name": "outcome",
            "docs": [
              "The winning outcome (None until resolved, Some(true) = YES won)"
            ],
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPosition",
      "docs": [
        "User position in a specific market"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "docs": [
              "The market this position is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "user",
            "docs": [
              "The user who owns this position"
            ],
            "type": "pubkey"
          },
          {
            "name": "yes_amount",
            "docs": [
              "Lamports bet on YES"
            ],
            "type": "u64"
          },
          {
            "name": "no_amount",
            "docs": [
              "Lamports bet on NO"
            ],
            "type": "u64"
          },
          {
            "name": "claimed",
            "docs": [
              "Whether winnings have been claimed"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
} as const;
