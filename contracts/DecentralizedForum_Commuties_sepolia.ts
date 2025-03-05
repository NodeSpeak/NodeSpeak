export const forumAddress = "0x0063642a60BD41B9e811e1AAf26055721c6c53Be";
// community
// 0x9449F3B78E5Bfde8Ed774459F04e9a757Cc4CC12
// postmana
// 0xDF466B0251C9f40D13D16292E285720E41E6C711
// foro
// 0x95a7c16746D2D772A6bBA7aE9a04e1863A781e40

export const forumABI = [
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            },
            {
                "internalType": "string",
                "name": "content",
                "type": "string"
            }
        ],
        "name": "addComment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            },
            {
                "internalType": "string",
                "name": "topic",
                "type": "string"
            }
        ],
        "name": "addTopicToCommunity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "contentCID",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "initialTopics",
                "type": "string[]"
            }
        ],
        "name": "createCommunity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            },
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "contentCID",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "imageCID",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "topic",
                "type": "string"
            }
        ],
        "name": "createPost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            },
            {
                "internalType": "uint32",
                "name": "commentId",
                "type": "uint32"
            }
        ],
        "name": "deactivateComment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "deactivateCommunity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            }
        ],
        "name": "deactivatePost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "joinCommunity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "leaveCommunity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            }
        ],
        "name": "likePost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_communityManagerAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_postManagerAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "communityManager",
        "outputs": [
            {
                "internalType": "contract ForumCommunityManager",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getActiveCommunities",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string[]",
                        "name": "topics",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint32",
                        "name": "postCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumCommunityManager.Community[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getActivePosts",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "imageCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "topic",
                        "type": "string"
                    },
                    {
                        "internalType": "uint32",
                        "name": "communityId",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "likeCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "commentCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumPostManager.Post[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            }
        ],
        "name": "getComments",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "content",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumPostManager.Comment[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "getCommunity",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string[]",
                        "name": "topics",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint32",
                        "name": "postCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumCommunityManager.Community",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "getCommunityMemberCount",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "getCommunityPosts",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "imageCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "topic",
                        "type": "string"
                    },
                    {
                        "internalType": "uint32",
                        "name": "communityId",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "likeCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "commentCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumPostManager.Post[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            }
        ],
        "name": "getCommunityTopics",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "postId",
                "type": "uint32"
            }
        ],
        "name": "getPost",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "imageCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "topic",
                        "type": "string"
                    },
                    {
                        "internalType": "uint32",
                        "name": "communityId",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "likeCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "commentCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumPostManager.Post",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getUserActiveCommunities",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "id",
                        "type": "uint32"
                    },
                    {
                        "internalType": "address",
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "contentCID",
                        "type": "string"
                    },
                    {
                        "internalType": "string[]",
                        "name": "topics",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint32",
                        "name": "postCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ForumCommunityManager.Community[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getUserCommunities",
        "outputs": [
            {
                "internalType": "uint32[]",
                "name": "",
                "type": "uint32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            },
            {
                "internalType": "string",
                "name": "topic",
                "type": "string"
            }
        ],
        "name": "isCommunityTopicValid",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "communityId",
                "type": "uint32"
            },
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "isMember",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "postManager",
        "outputs": [
            {
                "internalType": "contract ForumPostManager",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
