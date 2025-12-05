// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommon.sol";

contract ForumProfileManager {
    address public forumContract;

    struct Profile {
        address user;
        string nickname;
        string profileCID; // IPFS CID para la foto de perfil
        string coverCID;   // IPFS CID para la foto de portada
        string bioCID;     // IPFS CID para la biografía/descripción
        uint32 likesGiven;
        uint32 likesReceived;
        uint32 postCount;
        uint32 commentCount;
        uint32 followerCount;
        uint32 followingCount;
        bool isActive;
    }

    // Mappings relacionados con perfiles
    mapping(address => Profile) private profiles;
    mapping(address => bool) private hasActiveProfile;
    mapping(address => mapping(address => bool)) private following; // usuario -> seguido -> bool
    mapping(address => address[]) private followers; // usuario -> array de seguidores
    mapping(address => address[]) private followingList; // usuario -> array de usuarios seguidos
    mapping(address => uint256) private lastProfileUpdateTime;

    // Eventos
    event ProfileCreated(address indexed user, string nickname);
    event ProfileUpdated(address indexed user);
    event ProfileDeactivated(address indexed user); // NUEVO evento
    event ProfileReactivated(address indexed user); // NUEVO evento
    event UserFollowed(address indexed follower, address indexed followed);
    event UserUnfollowed(address indexed unfollower, address indexed unfollowed);

    constructor() {
        forumContract = msg.sender;
    }

    // Función para actualizar la dirección del contrato principal
    function setForumContract(address _newForumContract) external {
        require(msg.sender == forumContract, "Not authorized 23");
        forumContract = _newForumContract;
    }

    // Modificadores
    modifier onlyForumContract() {
        require(msg.sender == forumContract, "Not authorized 33");
        _;
    }

    modifier profileUpdateCooldown(address user) {
        require(
            block.timestamp >= lastProfileUpdateTime[user] + 10 minutes,
            "Profile update cooldown active"
        );
        _;
        lastProfileUpdateTime[user] = block.timestamp;
    }

    modifier profileExists(address user) {
        require(hasActiveProfile[user], "Profile does not exist");
        _;
    }

    // NUEVO modificador para verificar que el perfil existe y está activo
    modifier profileExistsAndActive(address user) {
        require(hasActiveProfile[user], "Profile does not exist");
        require(profiles[user].isActive, "Profile is deactivated");
        _;
    }

    // ========== FUNCIONES PARA LLAMADAS DESDE EL CONTRATO PRINCIPAL ==========
    
    // Crear un perfil para un usuario específico
    function createProfileFor(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external onlyForumContract {
        require(!hasActiveProfile[user], "Profile already exists");
        require(bytes(nickname).length > 0 && bytes(nickname).length <= 50, "Nickname size invalid");

        profiles[user] = Profile({
            user: user,
            nickname: nickname,
            profileCID: profileCID,
            coverCID: coverCID,
            bioCID: bioCID,
            likesGiven: 0,
            likesReceived: 0,
            postCount: 0,
            commentCount: 0,
            followerCount: 0,
            followingCount: 0,
            isActive: true
        });

        hasActiveProfile[user] = true;
        emit ProfileCreated(user, nickname);
    }

    // Actualizar un perfil para un usuario específico
    function updateProfileFor(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external onlyForumContract profileExistsAndActive(user) profileUpdateCooldown(user) {
        require(bytes(nickname).length > 0 && bytes(nickname).length <= 50, "Nickname size invalid");

        profiles[user].nickname = nickname;
        profiles[user].profileCID = profileCID;
        profiles[user].coverCID = coverCID;
        profiles[user].bioCID = bioCID;

        emit ProfileUpdated(user);
    }

    // NUEVA: Desactivar un perfil para un usuario específico
    function deactivateProfileFor(address user) external onlyForumContract profileExistsAndActive(user) {
        profiles[user].isActive = false;
        emit ProfileDeactivated(user);
    }

    // NUEVA: Reactivar un perfil para un usuario específico (opcional)
    function reactivateProfileFor(address user) external onlyForumContract profileExists(user) {
        require(!profiles[user].isActive, "Profile is already active");
        profiles[user].isActive = true;
        emit ProfileReactivated(user);
    }

    // Incrementar el contador de posts para un usuario
    function incrementPostCount(address user) external onlyForumContract profileExistsAndActive(user) {
        profiles[user].postCount++;
    }

    // Incrementar el contador de comentarios para un usuario
    function incrementCommentCount(address user) external onlyForumContract profileExistsAndActive(user) {
        profiles[user].commentCount++;
    }

    // Incrementar el contador de likes dados por un usuario
    function incrementLikesGiven(address user) external onlyForumContract profileExistsAndActive(user) {
        profiles[user].likesGiven++;
    }

    // Incrementar el contador de likes recibidos por un usuario
    function incrementLikesReceived(address user) external onlyForumContract profileExistsAndActive(user) {
        profiles[user].likesReceived++;
    }

    // NUEVAS: Incrementar/decrementar contadores de dislikes
    function incrementDislikesGiven(address user) external onlyForumContract profileExistsAndActive(user) {
        // Nota: Necesitarías agregar dislikesGiven al struct si quieres trackear esto
        // Por ahora lo dejo como placeholder
    }

    function incrementDislikesReceived(address user) external onlyForumContract profileExistsAndActive(user) {
        // Nota: Necesitarías agregar dislikesReceived al struct si quieres trackear esto
        // Por ahora lo dejo como placeholder
    }

    // Seguir a un usuario desde otro usuario específico
    function followUserFor(address follower, address userToFollow) external onlyForumContract profileExistsAndActive(follower) {
        require(follower != userToFollow, "Cannot follow yourself");
        require(!following[follower][userToFollow], "Already following this user");
        require(hasActiveProfile[userToFollow], "User to follow does not have an active profile");
        require(profiles[userToFollow].isActive, "Cannot follow deactivated profile");

        following[follower][userToFollow] = true;
        followers[userToFollow].push(follower);
        followingList[follower].push(userToFollow);
        profiles[follower].followingCount++;
        profiles[userToFollow].followerCount++;

        emit UserFollowed(follower, userToFollow);
    }

    // Dejar de seguir a un usuario desde otro usuario específico
    function unfollowUserFor(address unfollower, address userToUnfollow) external onlyForumContract profileExistsAndActive(unfollower) {
        require(following[unfollower][userToUnfollow], "Not following this user");

        following[unfollower][userToUnfollow] = false;

        // Eliminar de la lista de seguidos
        address[] storage followings = followingList[unfollower];
        for (uint256 i = 0; i < followings.length; i++) {
            if (followings[i] == userToUnfollow) {
                followings[i] = followings[followings.length - 1];
                followings.pop();
                break;
            }
        }

        // Eliminar de la lista de seguidores
        address[] storage userFollowers = followers[userToUnfollow];
        for (uint256 i = 0; i < userFollowers.length; i++) {
            if (userFollowers[i] == unfollower) {
                userFollowers[i] = userFollowers[userFollowers.length - 1];
                userFollowers.pop();
                break;
            }
        }

        profiles[unfollower].followingCount--;
        profiles[userToUnfollow].followerCount--;

        emit UserUnfollowed(unfollower, userToUnfollow);
    }

    // ========== FUNCIONES DE LECTURA ==========
    
    function getProfile(address user) external view returns (Profile memory) {
        require(hasActiveProfile[user], "Profile does not exist");
        return profiles[user];
    }

    // MODIFICADA: Ahora considera el estado isActive
    function hasProfile(address user) external view returns (bool) {
        return hasActiveProfile[user] && profiles[user].isActive;
    }

    // NUEVA: Verificar si existe un perfil (activo o no)
    function hasProfileAnyState(address user) external view returns (bool) {
        return hasActiveProfile[user];
    }

    // NUEVA: Verificar si un perfil está activo
    function isProfileActive(address user) external view returns (bool) {
        if (!hasActiveProfile[user]) return false;
        return profiles[user].isActive;
    }

    function getFollowers(address user) external view profileExists(user) returns (address[] memory) {
        return followers[user];
    }

    function getFollowing(address user) external view profileExists(user) returns (address[] memory) {
        return followingList[user];
    }

    function isFollowing(address follower, address followed) external view returns (bool) {
        return following[follower][followed];
    }

    // NUEVA: Obtener estadísticas completas del usuario
    function getUserStats(address user) external view profileExists(user) returns (
        uint32 likesGiven,
        uint32 likesReceived,
        uint32 postCount,
        uint32 commentCount,
        uint32 followerCount,
        uint32 followingCount,
        bool isActive
    ) {
        Profile memory profile = profiles[user];
        return (
            profile.likesGiven,
            profile.likesReceived,
            profile.postCount,
            profile.commentCount,
            profile.followerCount,
            profile.followingCount,
            profile.isActive
        );
    }

    // NUEVA: Obtener solo los contadores de interacciones
    function getUserInteractionStats(address user) external view profileExists(user) returns (
        uint32 likesGiven,
        uint32 likesReceived,
        uint32 postCount,
        uint32 commentCount
    ) {
        Profile memory profile = profiles[user];
        return (
            profile.likesGiven,
            profile.likesReceived,
            profile.postCount,
            profile.commentCount
        );
    }

    // NUEVA: Obtener solo los contadores de seguimiento
    function getUserFollowStats(address user) external view profileExists(user) returns (
        uint32 followerCount,
        uint32 followingCount,
        address[] memory followersList,
        address[] memory followingList
    ) {
        Profile memory profile = profiles[user];
        return (
            profile.followerCount,
            profile.followingCount,
            followers[user],
            followingList[user]
        );
    }

    // NUEVA: Obtener información básica del perfil (sin arrays)
    function getBasicProfile(address user) external view profileExists(user) returns (
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID,
        bool isActive
    ) {
        Profile memory profile = profiles[user];
        return (
            profile.nickname,
            profile.profileCID,
            profile.coverCID,
            profile.bioCID,
            profile.isActive
        );
    }

    // NUEVA: Verificar si dos usuarios se siguen mutuamente
    function areMutualFollows(address user1, address user2) external view returns (bool) {
        return following[user1][user2] && following[user2][user1];
    }

    // NUEVA: Obtener perfil completo solo si está activo
    function getActiveProfile(address user) external view returns (Profile memory) {
        require(hasActiveProfile[user], "Profile does not exist");
        require(profiles[user].isActive, "Profile is deactivated");
        return profiles[user];
    }
}