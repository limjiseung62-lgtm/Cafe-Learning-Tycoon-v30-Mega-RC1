// Fixed supplier pins; student saves and URL parameters cannot change them.
export const commonBankPins = [
    {
        "subject": "math",
        "base": "assets/common-learning/math/",
        "manifest": "math-manifest.json",
        "manifestSHA256": "ed9cf61da4f544a2c7b5521fbe72fa208790407f29e7e26f3c1073a0bb392215",
        "runtime": "runtime.mjs",
        "count": 49233,
        "files": [
            {
                "path": "approval-gate.mjs",
                "url": "approval-gate.mjs",
                "bytes": 2267,
                "sha256": "389421e2db6ade279a47d41f0df05b834dff737fa94c0c63cd38477d7670e2de",
                "transportBytes": 2267,
                "transportSHA256": "389421e2db6ade279a47d41f0df05b834dff737fa94c0c63cd38477d7670e2de",
                "gzip": false
            },
            {
                "path": "approved-core.mjs",
                "url": "approved-core.mjs",
                "bytes": 57774,
                "sha256": "24e1b8496561be6d455dc85580c38c00980974f865f2568a18cac6feb355b8ec",
                "transportBytes": 57774,
                "transportSHA256": "24e1b8496561be6d455dc85580c38c00980974f865f2568a18cac6feb355b8ec",
                "gzip": false
            },
            {
                "path": "CODE-NOTICE-KO.txt",
                "url": "CODE-NOTICE-KO.txt",
                "bytes": 805,
                "sha256": "58eb672819faad84cc09f8642a444956923ea5255eaccfc1c1e7d0591bc00fb6",
                "transportBytes": 805,
                "transportSHA256": "58eb672819faad84cc09f8642a444956923ea5255eaccfc1c1e7d0591bc00fb6",
                "gzip": false
            },
            {
                "path": "legacy/png.mjs",
                "url": "legacy/png.mjs",
                "bytes": 12374,
                "sha256": "9b90d1af5af4ee1a3abc80b788bf171da0ccffe023d9b4f6941f26a348f01c29",
                "transportBytes": 12374,
                "transportSHA256": "9b90d1af5af4ee1a3abc80b788bf171da0ccffe023d9b4f6941f26a348f01c29",
                "gzip": false
            },
            {
                "path": "legacy/report-port.mjs",
                "url": "legacy/report-port.mjs",
                "bytes": 660,
                "sha256": "b47523e53663aeb43e32d6d88a587e97bd76127c1180226c5253b3569e9c16cc",
                "transportBytes": 660,
                "transportSHA256": "b47523e53663aeb43e32d6d88a587e97bd76127c1180226c5253b3569e9c16cc",
                "gzip": false
            },
            {
                "path": "legacy/report.mjs",
                "url": "legacy/report.mjs",
                "bytes": 21416,
                "sha256": "1e65c792a26793910376d0cbc50402ac02472b40a23ba38523e572fa00b94f8a",
                "transportBytes": 21416,
                "transportSHA256": "1e65c792a26793910376d0cbc50402ac02472b40a23ba38523e572fa00b94f8a",
                "gzip": false
            },
            {
                "path": "legacy/runtime.mjs",
                "url": "legacy/runtime.mjs",
                "bytes": 48238,
                "sha256": "a424092487b43f94b46d655143758790af406b5279e49c66b1c97924b04128a5",
                "transportBytes": 48238,
                "transportSHA256": "a424092487b43f94b46d655143758790af406b5279e49c66b1c97924b04128a5",
                "gzip": false
            },
            {
                "path": "math-data.json",
                "url": "math-data.json.gz",
                "bytes": 140836000,
                "sha256": "6a0e320796bf0b736b6eb7962c334d1f39f956271bcc0bcac23a38622cd0b8fa",
                "transportBytes": 13682950,
                "transportSHA256": "7b1307d082571c2f552575224726f7fc353b7f008beb295ec516b4fe41d14417",
                "gzip": true
            },
            {
                "path": "math-native-reference-map.json",
                "url": "math-native-reference-map.json",
                "bytes": 2819,
                "sha256": "15bf32fe58ee66b3b8ac19f4ae920a1f5f4be5bc97e2339eba5bdb2dd7927158",
                "transportBytes": 2819,
                "transportSHA256": "15bf32fe58ee66b3b8ac19f4ae920a1f5f4be5bc97e2339eba5bdb2dd7927158",
                "gzip": false
            },
            {
                "path": "MATH-NOTICE-KO.txt",
                "url": "MATH-NOTICE-KO.txt",
                "bytes": 1177,
                "sha256": "60c36f8a2a6be9b8e7265b8c24f8e0aba87807fa7d7fc132cad55654c3e0cf0a",
                "transportBytes": 1177,
                "transportSHA256": "60c36f8a2a6be9b8e7265b8c24f8e0aba87807fa7d7fc132cad55654c3e0cf0a",
                "gzip": false
            },
            {
                "path": "operational-approval.json",
                "url": "operational-approval.json",
                "bytes": 6159,
                "sha256": "e5a21cb1f4963f9b515fa768749e1e7d0d45ba656e6a32c551716c76e9681ba2",
                "transportBytes": 6159,
                "transportSHA256": "e5a21cb1f4963f9b515fa768749e1e7d0d45ba656e6a32c551716c76e9681ba2",
                "gzip": false
            },
            {
                "path": "OPERATIONAL-NOTICE-KO.txt",
                "url": "OPERATIONAL-NOTICE-KO.txt",
                "bytes": 826,
                "sha256": "100db72b5cf4fecc9bd56b8278d29a84c5143c497236c4dfdb6b7986a4ec220e",
                "transportBytes": 826,
                "transportSHA256": "100db72b5cf4fecc9bd56b8278d29a84c5143c497236c4dfdb6b7986a4ec220e",
                "gzip": false
            },
            {
                "path": "png.mjs",
                "url": "png.mjs",
                "bytes": 12017,
                "sha256": "a125a647b4e976254132c01a6bac5fc145a8d368933de79cf6c810b22983c934",
                "transportBytes": 12017,
                "transportSHA256": "a125a647b4e976254132c01a6bac5fc145a8d368933de79cf6c810b22983c934",
                "gzip": false
            },
            {
                "path": "question-renderer.mjs",
                "url": "question-renderer.mjs",
                "bytes": 2768,
                "sha256": "ca6b74a67bffbc85b50dcdfbcaf137103f7da781bc7040589b675364d6413026",
                "transportBytes": 2768,
                "transportSHA256": "ca6b74a67bffbc85b50dcdfbcaf137103f7da781bc7040589b675364d6413026",
                "gzip": false
            },
            {
                "path": "record-store.mjs",
                "url": "record-store.mjs",
                "bytes": 7590,
                "sha256": "b6d8fd6ad9f338619f42cf8e978507e3c5cdaeab84fa9c3ccf1b3e4c6fd3401a",
                "transportBytes": 7590,
                "transportSHA256": "b6d8fd6ad9f338619f42cf8e978507e3c5cdaeab84fa9c3ccf1b3e4c6fd3401a",
                "gzip": false
            },
            {
                "path": "renderer-extension.mjs",
                "url": "renderer-extension.mjs",
                "bytes": 3675,
                "sha256": "57911fbea84670b8b83025e56ae308b678a13f23494b866e0eb81a26a90b48e0",
                "transportBytes": 3675,
                "transportSHA256": "57911fbea84670b8b83025e56ae308b678a13f23494b866e0eb81a26a90b48e0",
                "gzip": false
            },
            {
                "path": "report-port.mjs",
                "url": "report-port.mjs",
                "bytes": 711,
                "sha256": "be5e82bb5dd4e7544ab0df569cac3c09a18d131a0ff94b3e2399e505a5510f8c",
                "transportBytes": 711,
                "transportSHA256": "be5e82bb5dd4e7544ab0df569cac3c09a18d131a0ff94b3e2399e505a5510f8c",
                "gzip": false
            },
            {
                "path": "report.mjs",
                "url": "report.mjs",
                "bytes": 16063,
                "sha256": "1c3237b06aae1cf7712025b6afafabe98deb9d80e8216a814ce0efc55dc660ee",
                "transportBytes": 16063,
                "transportSHA256": "1c3237b06aae1cf7712025b6afafabe98deb9d80e8216a814ce0efc55dc660ee",
                "gzip": false
            },
            {
                "path": "runtime.mjs",
                "url": "runtime.mjs",
                "bytes": 2446,
                "sha256": "f0779749b413fefb54a985703711736cab7b83b73c2368a4dc06a18c22e8e1d2",
                "transportBytes": 2446,
                "transportSHA256": "f0779749b413fefb54a985703711736cab7b83b73c2368a4dc06a18c22e8e1d2",
                "gzip": false
            },
            {
                "path": "scopes.mjs",
                "url": "scopes.mjs",
                "bytes": 2721,
                "sha256": "afced0e7c3b3b735dd1c0d886b826896e6ab54f6f4b6c9f45a96cf8260746128",
                "transportBytes": 2721,
                "transportSHA256": "afced0e7c3b3b735dd1c0d886b826896e6ab54f6f4b6c9f45a96cf8260746128",
                "gzip": false
            },
            {
                "path": "ui.css",
                "url": "ui.css",
                "bytes": 8593,
                "sha256": "5a693333cc5e0e67ab4cb3ce75f536ca97e68088845deb669333ff18ba0e6df6",
                "transportBytes": 8593,
                "transportSHA256": "5a693333cc5e0e67ab4cb3ce75f536ca97e68088845deb669333ff18ba0e6df6",
                "gzip": false
            },
            {
                "path": "util.mjs",
                "url": "util.mjs",
                "bytes": 1231,
                "sha256": "c286b763abb0c152809a16bd048bb146c05317b72db04189d30b4f4ebef5f5db",
                "transportBytes": 1231,
                "transportSHA256": "c286b763abb0c152809a16bd048bb146c05317b72db04189d30b4f4ebef5f5db",
                "gzip": false
            },
            {
                "path": "math-manifest.json",
                "url": "math-manifest.json",
                "bytes": 5925,
                "sha256": "ed9cf61da4f544a2c7b5521fbe72fa208790407f29e7e26f3c1073a0bb392215",
                "transportBytes": 5925,
                "transportSHA256": "ed9cf61da4f544a2c7b5521fbe72fa208790407f29e7e26f3c1073a0bb392215",
                "gzip": false
            },
            {
                "path": "math-manifest.json",
                "url": "math-manifest.json",
                "bytes": 5925,
                "sha256": "ed9cf61da4f544a2c7b5521fbe72fa208790407f29e7e26f3c1073a0bb392215",
                "transportBytes": 5925,
                "transportSHA256": "ed9cf61da4f544a2c7b5521fbe72fa208790407f29e7e26f3c1073a0bb392215",
                "gzip": false
            }
        ]
    },
    {
        "subject": "science",
        "base": "assets/common-learning/science-operational-112/",
        "manifest": "manifest.json",
        "manifestSHA256": "6adfd9434e8b23e17ad37e5cab32b8c7255862a4f053e90c06043c96d6327f1f",
        "runtime": "runtime.mjs",
        "count": 104,
        "files": [
            {
                "path": "approval-gate.mjs",
                "url": "approval-gate.mjs",
                "bytes": 2936,
                "sha256": "2179836e4673dbb65d0f5a46ad0d2d6272643a2019dc1c07aede0469be93e946",
                "transportBytes": 2936,
                "transportSHA256": "2179836e4673dbb65d0f5a46ad0d2d6272643a2019dc1c07aede0469be93e946",
                "gzip": false
            },
            {
                "path": "approved-core.mjs",
                "url": "approved-core.mjs",
                "bytes": 57724,
                "sha256": "45fed2224e185d27f40571c36ccd1f60a244eda7ab2be01abdb4d23b77cc9be3",
                "transportBytes": 57724,
                "transportSHA256": "45fed2224e185d27f40571c36ccd1f60a244eda7ab2be01abdb4d23b77cc9be3",
                "gzip": false
            },
            {
                "path": "CODE-NOTICE-KO.txt",
                "url": "CODE-NOTICE-KO.txt",
                "bytes": 805,
                "sha256": "58eb672819faad84cc09f8642a444956923ea5255eaccfc1c1e7d0591bc00fb6",
                "transportBytes": 805,
                "transportSHA256": "58eb672819faad84cc09f8642a444956923ea5255eaccfc1c1e7d0591bc00fb6",
                "gzip": false
            },
            {
                "path": "legacy/png.mjs",
                "url": "legacy/png.mjs",
                "bytes": 12374,
                "sha256": "9b90d1af5af4ee1a3abc80b788bf171da0ccffe023d9b4f6941f26a348f01c29",
                "transportBytes": 12374,
                "transportSHA256": "9b90d1af5af4ee1a3abc80b788bf171da0ccffe023d9b4f6941f26a348f01c29",
                "gzip": false
            },
            {
                "path": "legacy/report-port.mjs",
                "url": "legacy/report-port.mjs",
                "bytes": 660,
                "sha256": "b47523e53663aeb43e32d6d88a587e97bd76127c1180226c5253b3569e9c16cc",
                "transportBytes": 660,
                "transportSHA256": "b47523e53663aeb43e32d6d88a587e97bd76127c1180226c5253b3569e9c16cc",
                "gzip": false
            },
            {
                "path": "legacy/report.mjs",
                "url": "legacy/report.mjs",
                "bytes": 21416,
                "sha256": "1e65c792a26793910376d0cbc50402ac02472b40a23ba38523e572fa00b94f8a",
                "transportBytes": 21416,
                "transportSHA256": "1e65c792a26793910376d0cbc50402ac02472b40a23ba38523e572fa00b94f8a",
                "gzip": false
            },
            {
                "path": "legacy/runtime.mjs",
                "url": "legacy/runtime.mjs",
                "bytes": 48238,
                "sha256": "a424092487b43f94b46d655143758790af406b5279e49c66b1c97924b04128a5",
                "transportBytes": 48238,
                "transportSHA256": "a424092487b43f94b46d655143758790af406b5279e49c66b1c97924b04128a5",
                "gzip": false
            },
            {
                "path": "MATH-NOTICE-KO.txt",
                "url": "MATH-NOTICE-KO.txt",
                "bytes": 1177,
                "sha256": "60c36f8a2a6be9b8e7265b8c24f8e0aba87807fa7d7fc132cad55654c3e0cf0a",
                "transportBytes": 1177,
                "transportSHA256": "60c36f8a2a6be9b8e7265b8c24f8e0aba87807fa7d7fc132cad55654c3e0cf0a",
                "gzip": false
            },
            {
                "path": "OPERATIONAL-NOTICE-KO.txt",
                "url": "OPERATIONAL-NOTICE-KO.txt",
                "bytes": 826,
                "sha256": "100db72b5cf4fecc9bd56b8278d29a84c5143c497236c4dfdb6b7986a4ec220e",
                "transportBytes": 826,
                "transportSHA256": "100db72b5cf4fecc9bd56b8278d29a84c5143c497236c4dfdb6b7986a4ec220e",
                "gzip": false
            },
            {
                "path": "png.mjs",
                "url": "png.mjs",
                "bytes": 12017,
                "sha256": "a125a647b4e976254132c01a6bac5fc145a8d368933de79cf6c810b22983c934",
                "transportBytes": 12017,
                "transportSHA256": "a125a647b4e976254132c01a6bac5fc145a8d368933de79cf6c810b22983c934",
                "gzip": false
            },
            {
                "path": "question-renderer.mjs",
                "url": "question-renderer.mjs",
                "bytes": 2768,
                "sha256": "ca6b74a67bffbc85b50dcdfbcaf137103f7da781bc7040589b675364d6413026",
                "transportBytes": 2768,
                "transportSHA256": "ca6b74a67bffbc85b50dcdfbcaf137103f7da781bc7040589b675364d6413026",
                "gzip": false
            },
            {
                "path": "record-store.mjs",
                "url": "record-store.mjs",
                "bytes": 7590,
                "sha256": "b6d8fd6ad9f338619f42cf8e978507e3c5cdaeab84fa9c3ccf1b3e4c6fd3401a",
                "transportBytes": 7590,
                "transportSHA256": "b6d8fd6ad9f338619f42cf8e978507e3c5cdaeab84fa9c3ccf1b3e4c6fd3401a",
                "gzip": false
            },
            {
                "path": "renderer-extension.mjs",
                "url": "renderer-extension.mjs",
                "bytes": 3675,
                "sha256": "57911fbea84670b8b83025e56ae308b678a13f23494b866e0eb81a26a90b48e0",
                "transportBytes": 3675,
                "transportSHA256": "57911fbea84670b8b83025e56ae308b678a13f23494b866e0eb81a26a90b48e0",
                "gzip": false
            },
            {
                "path": "report-port.mjs",
                "url": "report-port.mjs",
                "bytes": 711,
                "sha256": "be5e82bb5dd4e7544ab0df569cac3c09a18d131a0ff94b3e2399e505a5510f8c",
                "transportBytes": 711,
                "transportSHA256": "be5e82bb5dd4e7544ab0df569cac3c09a18d131a0ff94b3e2399e505a5510f8c",
                "gzip": false
            },
            {
                "path": "report.mjs",
                "url": "report.mjs",
                "bytes": 16063,
                "sha256": "1c3237b06aae1cf7712025b6afafabe98deb9d80e8216a814ce0efc55dc660ee",
                "transportBytes": 16063,
                "transportSHA256": "1c3237b06aae1cf7712025b6afafabe98deb9d80e8216a814ce0efc55dc660ee",
                "gzip": false
            },
            {
                "path": "runtime.mjs",
                "url": "runtime.mjs",
                "bytes": 2667,
                "sha256": "90e3cdb00f1d42d664a4c51d884c6f2aafc05e276b6ba3aac6fc67567345a051",
                "transportBytes": 2667,
                "transportSHA256": "90e3cdb00f1d42d664a4c51d884c6f2aafc05e276b6ba3aac6fc67567345a051",
                "gzip": false
            },
            {
                "path": "SCIENCE-NOTICE-KO.txt",
                "url": "SCIENCE-NOTICE-KO.txt",
                "bytes": 640,
                "sha256": "011a08cad0640c5d1193f5d54afb20fab0091e1362347cd42f47b0d9205894fc",
                "transportBytes": 640,
                "transportSHA256": "011a08cad0640c5d1193f5d54afb20fab0091e1362347cd42f47b0d9205894fc",
                "gzip": false
            },
            {
                "path": "scopes.mjs",
                "url": "scopes.mjs",
                "bytes": 2721,
                "sha256": "afced0e7c3b3b735dd1c0d886b826896e6ab54f6f4b6c9f45a96cf8260746128",
                "transportBytes": 2721,
                "transportSHA256": "afced0e7c3b3b735dd1c0d886b826896e6ab54f6f4b6c9f45a96cf8260746128",
                "gzip": false
            },
            {
                "path": "ui.css",
                "url": "ui.css",
                "bytes": 8593,
                "sha256": "5a693333cc5e0e67ab4cb3ce75f536ca97e68088845deb669333ff18ba0e6df6",
                "transportBytes": 8593,
                "transportSHA256": "5a693333cc5e0e67ab4cb3ce75f536ca97e68088845deb669333ff18ba0e6df6",
                "gzip": false
            },
            {
                "path": "util.mjs",
                "url": "util.mjs",
                "bytes": 1231,
                "sha256": "c286b763abb0c152809a16bd048bb146c05317b72db04189d30b4f4ebef5f5db",
                "transportBytes": 1231,
                "transportSHA256": "c286b763abb0c152809a16bd048bb146c05317b72db04189d30b4f4ebef5f5db",
                "gzip": false
            },
            {
                "path": "science-data.json",
                "url": "science-data.json",
                "bytes": 542507,
                "sha256": "13c2576de939208a09515754916c809068abe5ae71d07c14e1a2e52b46c8852e",
                "transportBytes": 542507,
                "transportSHA256": "13c2576de939208a09515754916c809068abe5ae71d07c14e1a2e52b46c8852e",
                "gzip": false
            },
            {
                "path": "science-native-reference-map.json",
                "url": "science-native-reference-map.json",
                "bytes": 223,
                "sha256": "08f4cbdda8f4aba712e05dc89b6bb895213e9038d05e4172ce8324bc022a9e82",
                "transportBytes": 223,
                "transportSHA256": "08f4cbdda8f4aba712e05dc89b6bb895213e9038d05e4172ce8324bc022a9e82",
                "gzip": false
            },
            {
                "path": "science-operational-approval.json",
                "url": "science-operational-approval.json",
                "bytes": 5911,
                "sha256": "85e8e90fb559c4b9092d4c7496d7cc78f1eff7f4e3910ee332fd82a6a61f679e",
                "transportBytes": 5911,
                "transportSHA256": "85e8e90fb559c4b9092d4c7496d7cc78f1eff7f4e3910ee332fd82a6a61f679e",
                "gzip": false
            },
            {
                "path": "manifest.json",
                "url": "manifest.json",
                "bytes": 5841,
                "sha256": "6adfd9434e8b23e17ad37e5cab32b8c7255862a4f053e90c06043c96d6327f1f",
                "transportBytes": 5841,
                "transportSHA256": "6adfd9434e8b23e17ad37e5cab32b8c7255862a4f053e90c06043c96d6327f1f",
                "gzip": false
            }
        ]
    }
];
