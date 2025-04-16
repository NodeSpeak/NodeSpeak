// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommunityManager.sol";
import "./ForumPostManager.sol";
import "./ForumProfileManager.sol";

contract DecentralizedForum {
    ForumCommunityManager public communityManager;
    ForumPostManager public postManager;
    ForumProfileManager public profileManager;

    // Constructor modificado para recibir las direcciones de los contratos ya desplegados
    constructor(
        address _communityManagerAddress, 
        address _postManagerAddress,
        address _profileManagerAddress
    ) {
        communityManager = ForumCommunityManager(_communityManagerAddress);
        postManager = ForumPostManager(_postManagerAddress);
        profileManager = ForumProfileManager(_profileManagerAddress);
    }

    // Funciones proxy para comunidades
    function createCommunity(
        string memory contentCID,
        string[] memory initialTopics
    ) external {
        communityManager.createCommunityFor(msg.sender, contentCID, initialTopics);
    }

    function addTopicToCommunity(uint32 communityId, string memory topic) external {
        communityManager.addTopicToCommunityFor(msg.sender, communityId, topic);
    }

    function joinCommunity(uint32 communityId) external {
        communityManager.joinCommunityFor(msg.sender, communityId);
    }
    
    function leaveCommunity(uint32 communityId) external {
        communityManager.leaveCommunityFor(msg.sender, communityId);
    }

    function deactivateCommunity(uint32 communityId) external {
        communityManager.deactivateCommunityFor(msg.sender, communityId);
    }

    function getCommunity(uint32 communityId) external view returns (ForumCommunityManager.Community memory) {
        return communityManager.getCommunity(communityId);
    }

    function getActiveCommunities() external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getActiveCommunities();
    }

    function getCommunityTopics(uint32 communityId) external view returns (string[] memory) {
        return communityManager.getCommunityTopics(communityId);
    }
    
    function isCommunityTopicValid(uint32 communityId, string memory topic) external view returns (bool) {
        return communityManager.isCommunityTopicValid(communityId, topic);
    }
    
    function isMember(uint32 communityId, address user) external view returns (bool) {
        return communityManager.isMember(communityId, user);
    }
    
    function getUserCommunities(address user) external view returns (uint32[] memory) {
        return communityManager.getUserCommunities(user);
    }
    
    function getUserActiveCommunities(address user) external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getUserActiveCommunities(user);
    }
    
    function getCommunityMemberCount(uint32 communityId) external view returns (uint32) {
        return communityManager.getCommunityMemberCount(communityId);
    }

    // Funciones proxy para posts

    function createPost(
        uint32 communityId,
        string memory title,
        string memory contentCID,
        string memory imageCID,
        string memory topic
    ) external {
        postManager.createPostFor(msg.sender, communityId, title, contentCID, imageCID, topic);
    }

    function likePost(uint32 postId) external {
        postManager.likePostFor(msg.sender, postId);
        
        // Al dar like a un post, actualizar contadores en el perfil
        address postAuthor = postManager.getPost(postId).author;
        
        if (profileManager.hasProfile(msg.sender)) {
            profileManager.incrementLikesGiven(msg.sender);
        }
        
        if (profileManager.hasProfile(postAuthor)) {
            profileManager.incrementLikesReceived(postAuthor);
        }
    }

    function addComment(uint32 postId, string memory content) external {
        postManager.addCommentFor(msg.sender, postId, content);
    }

    function deactivatePost(uint32 postId) external {
        postManager.deactivatePostFor(msg.sender, postId);
    }

    function deactivateComment(uint32 postId, uint32 commentId) external {
        postManager.deactivateCommentFor(msg.sender, postId, commentId);
    }

    function getPost(uint32 postId) external view returns (ForumPostManager.Post memory) {
        return postManager.getPost(postId);
    }

    function getComments(uint32 postId) external view returns (ForumPostManager.Comment[] memory) {
        return postManager.getComments(postId);
    }

    function getActivePosts() external view returns (ForumPostManager.Post[] memory) {
        return postManager.getActivePosts();
    }

    function getCommunityPosts(uint32 communityId) external view returns (ForumPostManager.Post[] memory) {
        return postManager.getCommunityPosts(communityId);
    }
    
    // Nuevas funciones proxy para perfiles
    
    function createProfile(
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external {
        profileManager.createProfileFor(msg.sender, nickname, profileCID, coverCID, bioCID);
    }
    
    function updateProfile(
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external {
        profileManager.updateProfileFor(msg.sender, nickname, profileCID, coverCID, bioCID);
    }
    
    function followUser(address userToFollow) external {
        profileManager.followUserFor(msg.sender, userToFollow);
    }
    
    function unfollowUser(address userToUnfollow) external {
        profileManager.unfollowUserFor(msg.sender, userToUnfollow);
    }
    
    function getProfile(address user) external view returns (ForumProfileManager.Profile memory) {
        return profileManager.getProfile(user);
    }
    
    function hasProfile(address user) external view returns (bool) {
        return profileManager.hasProfile(user);
    }
    
    function getFollowers(address user) external view returns (address[] memory) {
        return profileManager.getFollowers(user);
    }
    
    function getFollowing(address user) external view returns (address[] memory) {
        return profileManager.getFollowing(user);
    }
}