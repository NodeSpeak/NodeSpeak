// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommunityManager.sol";
import "./ForumPostManager.sol";
import { ForumProfileManager } from "./ForumProfileManager.sol";

contract DecentralizedForum {
    ForumCommunityManager public communityManager;
    ForumPostManager public postManager;
    ForumProfileManager public profileManager;

    constructor(
        address _communityManagerAddress, 
        address _postManagerAddress,
        address _profileManagerAddress
    ) {
        communityManager = ForumCommunityManager(_communityManagerAddress);
        postManager = ForumPostManager(_postManagerAddress);
        profileManager = ForumProfileManager(_profileManagerAddress);
    }

    // ========== FUNCIONES PARA COMUNIDADES ==========
    
    function createCommunity(
        string memory contentCID,
        string[] memory initialTopics,
        string memory profileCID,
        string memory coverCID
    ) external {
        communityManager.createCommunityFor(msg.sender, contentCID, initialTopics, profileCID, coverCID);
    }

    function updateCommunityImages(
        uint32 communityId,
        string memory profileCID,
        string memory coverCID
    ) external {
        communityManager.updateCommunityImagesFor(msg.sender, communityId, profileCID, coverCID);
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

    // Funciones de lectura para comunidades (existentes)
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

    // NUEVAS: Funciones para "Mis Comunidades"
    function getUserCreatedCommunities(address user) external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getUserCreatedCommunities(user);
    }

    function getUserMemberCommunities(address user) external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getUserMemberCommunities(user);
    }

    function getUserCommunitiesDetailed(address user) external view returns (
        ForumCommunityManager.Community[] memory createdCommunities,
        ForumCommunityManager.Community[] memory memberCommunities
    ) {
        return communityManager.getUserCommunitiesDetailed(user);
    }

    function isUserCommunityCreator(address user, uint32 communityId) external view returns (bool) {
        return communityManager.isUserCommunityCreator(user, communityId);
    }

    // ========== FUNCIONES PARA POSTS ==========

    function createPost(
        uint32 communityId,
        string memory title,
        string memory contentCID,
        string memory imageCID,
        string memory topic
    ) external {
        postManager.createPostFor(msg.sender, communityId, title, contentCID, imageCID, topic);
        
        // Actualizar contador de posts en el perfil del usuario
        if (profileManager.hasProfile(msg.sender)) {
            profileManager.incrementPostCount(msg.sender);
        }
    }

    function likePost(uint32 postId) external {
        postManager.likePostFor(msg.sender, postId);
        
        // Al dar like a un post, actualizar contadores en los perfiles
        address postAuthor = postManager.getPost(postId).author;
        
        if (profileManager.hasProfile(msg.sender)) {
            profileManager.incrementLikesGiven(msg.sender);
        }
        
        if (profileManager.hasProfile(postAuthor)) {
            profileManager.incrementLikesReceived(postAuthor);
        }
    }

    // NUEVA: Dar dislike a un post
    function dislikePost(uint32 postId) external {
        postManager.dislikePostFor(msg.sender, postId);
        
        // Actualizar contadores en los perfiles si decidimos trackear dislikes
        // address postAuthor = postManager.getPost(postId).author;
        // if (profileManager.hasProfile(msg.sender)) {
        //     profileManager.incrementDislikesGiven(msg.sender);
        // }
        // if (profileManager.hasProfile(postAuthor)) {
        //     profileManager.incrementDislikesReceived(postAuthor);
        // }
    }

    // NUEVAS: Quitar like/dislike
    function removeLike(uint32 postId) external {
        postManager.removeLike(postId);
    }

    function removeDislike(uint32 postId) external {
        postManager.removeDislike(postId);
    }

    function addComment(uint32 postId, string memory content) external {
        postManager.addCommentFor(msg.sender, postId, content);
        
        // Actualizar contador de comentarios en el perfil
        if (profileManager.hasProfile(msg.sender)) {
            profileManager.incrementCommentCount(msg.sender);
        }
    }

    // NUEVA: Agregar comentario citando otro comentario
    function addCommentWithQuote(uint32 postId, string memory content, uint32 quotedCommentId) external {
        postManager.addCommentWithQuoteFor(msg.sender, postId, content, quotedCommentId);
        
        // Actualizar contador de comentarios en el perfil
        if (profileManager.hasProfile(msg.sender)) {
            profileManager.incrementCommentCount(msg.sender);
        }
    }

    function deactivatePost(uint32 postId) external {
        postManager.deactivatePostFor(msg.sender, postId);
    }

    function deactivateComment(uint32 postId, uint32 commentId) external {
        postManager.deactivateCommentFor(msg.sender, postId, commentId);
    }

    // Funciones de lectura para posts (existentes)
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

    // NUEVAS: Funciones para posts recientes
    function getRecentCreatorPosts(uint32 communityId, uint256 timeframeSeconds) external view returns (ForumPostManager.Post[] memory) {
        return postManager.getRecentCreatorPosts(communityId, timeframeSeconds);
    }

    function getRecentNonCreatorPosts(uint32 communityId, uint256 timeframeSeconds) external view returns (ForumPostManager.Post[] memory) {
        return postManager.getRecentNonCreatorPosts(communityId, timeframeSeconds);
    }

    // NUEVAS: Funciones de utilidad para posts con timeframes predefinidos
    function getWeeklyCreatorPosts(uint32 communityId) external view returns (ForumPostManager.Post[] memory) {
        return postManager.getRecentCreatorPosts(communityId, 604800); // 7 días en segundos
    }

    function getWeeklyNonCreatorPosts(uint32 communityId) external view returns (ForumPostManager.Post[] memory) {
        return postManager.getRecentNonCreatorPosts(communityId, 604800); // 7 días en segundos
    }

    // NUEVAS: Verificar likes/dislikes del usuario
    function hasUserLikedPost(uint32 postId, address user) external view returns (bool) {
        return postManager.hasUserLikedPost(postId, user);
    }

    function hasUserDislikedPost(uint32 postId, address user) external view returns (bool) {
        return postManager.hasUserDislikedPost(postId, user);
    }

    // Para el usuario actual
    function hasCurrentUserLikedPost(uint32 postId) external view returns (bool) {
        return postManager.hasUserLikedPost(postId, msg.sender);
    }

    function hasCurrentUserDislikedPost(uint32 postId) external view returns (bool) {
        return postManager.hasUserDislikedPost(postId, msg.sender);
    }
    
    // ========== FUNCIONES PARA PERFILES ==========
    
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

    // NUEVA: Desactivar perfil
    function deactivateProfile() external {
        profileManager.deactivateProfileFor(msg.sender);
    }

    // NUEVA: Reactivar perfil (opcional)
    function reactivateProfile() external {
        profileManager.reactivateProfileFor(msg.sender);
    }
    
    function followUser(address userToFollow) external {
        profileManager.followUserFor(msg.sender, userToFollow);
    }
    
    function unfollowUser(address userToUnfollow) external {
        profileManager.unfollowUserFor(msg.sender, userToUnfollow);
    }
    
    // Funciones de lectura para perfiles (existentes)
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
    
    function isFollowing(address follower, address followed) external view returns (bool) {
        return profileManager.isFollowing(follower, followed);
    }

    // NUEVAS: Funciones adicionales para perfiles
    function hasProfileAnyState(address user) external view returns (bool) {
        return profileManager.hasProfileAnyState(user);
    }

    function isProfileActive(address user) external view returns (bool) {
        return profileManager.isProfileActive(user);
    }

    function getUserStats(address user) external view returns (
        uint32 likesGiven,
        uint32 likesReceived,
        uint32 postCount,
        uint32 commentCount,
        uint32 followerCount,
        uint32 followingCount,
        bool isActive
    ) {
        return profileManager.getUserStats(user);
    }

    function getUserInteractionStats(address user) external view returns (
        uint32 likesGiven,
        uint32 likesReceived,
        uint32 postCount,
        uint32 commentCount
    ) {
        return profileManager.getUserInteractionStats(user);
    }

    function getUserFollowStats(address user) external view returns (
        uint32 followerCount,
        uint32 followingCount,
        address[] memory followersList,
        address[] memory followingList
    ) {
        return profileManager.getUserFollowStats(user);
    }

    function getBasicProfile(address user) external view returns (
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID,
        bool isActive
    ) {
        return profileManager.getBasicProfile(user);
    }

    function areMutualFollows(address user1, address user2) external view returns (bool) {
        return profileManager.areMutualFollows(user1, user2);
    }

    function getActiveProfile(address user) external view returns (ForumProfileManager.Profile memory) {
        return profileManager.getActiveProfile(user);
    }

    // NUEVAS: Funciones para el usuario actual
    function getMyStats() external view returns (
        uint32 likesGiven,
        uint32 likesReceived,
        uint32 postCount,
        uint32 commentCount,
        uint32 followerCount,
        uint32 followingCount,
        bool isActive
    ) {
        return profileManager.getUserStats(msg.sender);
    }

    function getMyCreatedCommunities() external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getUserCreatedCommunities(msg.sender);
    }

    function getMyMemberCommunities() external view returns (ForumCommunityManager.Community[] memory) {
        return communityManager.getUserMemberCommunities(msg.sender);
    }

    function getMyCommunitiesDetailed() external view returns (
        ForumCommunityManager.Community[] memory createdCommunities,
        ForumCommunityManager.Community[] memory memberCommunities
    ) {
        return communityManager.getUserCommunitiesDetailed(msg.sender);
    }
}