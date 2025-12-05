export const forumAddress = "0xd8214489A7bdE79De84dF45140796092F778E14e";

export const forumABI = [
	{
		"inputs": [
			{ "internalType": "uint32", "name": "postId", "type": "uint32" },
			{ "internalType": "string", "name": "content", "type": "string" }
		],
		"name": "addComment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint32", "name": "postId", "type": "uint32" },
			{ "indexed": true, "internalType": "uint32", "name": "commentId", "type": "uint32" },
			{ "indexed": true, "internalType": "address", "name": "author", "type": "address" }
		],
		"name": "CommentAdded",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "title", "type": "string" },
			{ "internalType": "string", "name": "contentCID", "type": "string" },
			{ "internalType": "string", "name": "imageCID", "type": "string" },
			{ "internalType": "string", "name": "topic", "type": "string" }
		],
		"name": "createPost",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllPosts",
		"outputs": [
			{
				"components": [
					{ "internalType": "uint32", "name": "id", "type": "uint32" },
					{ "internalType": "address", "name": "author", "type": "address" },
					{ "internalType": "string", "name": "title", "type": "string" },
					{ "internalType": "string", "name": "contentCID", "type": "string" },
					{ "internalType": "string", "name": "imageCID", "type": "string" },
					{ "internalType": "string", "name": "topic", "type": "string" },
					{ "internalType": "uint32", "name": "likeCount", "type": "uint32" },
					{ "internalType": "uint32", "name": "commentCount", "type": "uint32" },
					{ "internalType": "bool", "name": "isActive", "type": "bool" }
				],
				"internalType": "struct DecentralizedForum.Post[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint32", "name": "postId", "type": "uint32" }
		],
		"name": "getPost",
		"outputs": [
			{
				"components": [
					{ "internalType": "uint32", "name": "id", "type": "uint32" },
					{ "internalType": "address", "name": "author", "type": "address" },
					{ "internalType": "string", "name": "title", "type": "string" },
					{ "internalType": "string", "name": "contentCID", "type": "string" },
					{ "internalType": "string", "name": "imageCID", "type": "string" },
					{ "internalType": "string", "name": "topic", "type": "string" },
					{ "internalType": "uint32", "name": "likeCount", "type": "uint32" },
					{ "internalType": "uint32", "name": "commentCount", "type": "uint32" },
					{ "internalType": "bool", "name": "isActive", "type": "bool" }
				],
				"internalType": "struct DecentralizedForum.Post",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
