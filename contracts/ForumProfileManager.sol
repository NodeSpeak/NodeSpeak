// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommon.sol";

contract ForumProfileManager {
    address public forumContract;

    struct Profile {
        bool exists;
        string nickname;       // User's preferred name or ENS
        string profileCID;     // IPFS CID for profile picture
        string coverCID;       // IPFS CID for cover photo
        string bioCID;         // IPFS CID for user bio
        uint32 likesReceived;  // Number of likes received across posts and comments
        uint32 likesGiven;     // Number of likes given to others
        uint32 followers;      // Number of followers
        uint32 following;      // Number of users being followed
        uint256 createdAt;     // When the profile was created
        uint256 updatedAt;     // When the profile was last updated
    }

    // Mappings
    mapping(address => Profile) public profiles;
    mapping(address => address[]) private userFollowers; // Who follows this user
    mapping(address => address[]) private userFollowing; // Who this user follows
    mapping(address => mapping(address => bool)) public isFollowing; // Is userA following userB

    // Events
    event ProfileCreated(address indexed user, string nickname);
    event ProfileUpdated(address indexed user, string nickname);
    event UserFollowed(address indexed follower, address indexed followed);
    event UserUnfollowed(address indexed follower, address indexed followed);

    constructor() {
        forumContract = msg.sender;
    }

    // Función para actualizar la dirección del contrato principal
    function setForumContract(address _newForumContract) external {
        require(msg.sender == forumContract, "Not authorized");
        forumContract = _newForumContract;
    }

    // Modificadores
    modifier onlyForumContract() {
        require(msg.sender == forumContract, "Not authorized");
        _;
    }

    modifier profileExists(address user) {
        require(profiles[user].exists, "Profile does not exist");
        _;
    }

    // ========== FUNCIONES PARA LLAMADAS DIRECTAS ==========

    // Crear un nuevo perfil
    function createProfile(
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external {
        _createProfile(msg.sender, nickname, profileCID, coverCID, bioCID);
    }

    // Actualizar perfil existente
    function updateProfile(
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external profileExists(msg.sender) {
        _updateProfile(msg.sender, nickname, profileCID, coverCID, bioCID);
    }

    // Seguir a otro usuario
    function followUser(address userToFollow) external {
        _followUser(msg.sender, userToFollow);
    }

    // Dejar de seguir a un usuario
    function unfollowUser(address userToUnfollow) external {
        _unfollowUser(msg.sender, userToUnfollow);
    }

    // ========== FUNCIONES PARA LLAMADAS DESDE EL CONTRATO PRINCIPAL ==========

    // Crear un nuevo perfil para un usuario específico
    function createProfileFor(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external onlyForumContract {
        _createProfile(user, nickname, profileCID, coverCID, bioCID);
    }

    // Actualizar perfil para un usuario específico
    function updateProfileFor(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) external onlyForumContract profileExists(user) {
        _updateProfile(user, nickname, profileCID, coverCID, bioCID);
    }

    // Seguir a un usuario para un usuario específico
    function followUserFor(
        address follower,
        address userToFollow
    ) external onlyForumContract {
        _followUser(follower, userToFollow);
    }

    // Dejar de seguir a un usuario para un usuario específico
    function unfollowUserFor(
        address follower,
        address userToUnfollow
    ) external onlyForumContract {
        _unfollowUser(follower, userToUnfollow);
    }

    // Incrementar likes recibidos (llamado desde ForumPostManager)
    function incrementLikesReceived(address user) external onlyForumContract profileExists(user) {
        profiles[user].likesReceived++;
    }

    // Incrementar likes dados (llamado desde ForumPostManager)
    function incrementLikesGiven(address user) external onlyForumContract profileExists(user) {
        profiles[user].likesGiven++;
    }

    // ========== FUNCIONES INTERNAS ==========

    // Implementación interna para crear un perfil
    function _createProfile(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) internal {
        require(!profiles[user].exists, "Profile already exists");

        profiles[user] = Profile({
            exists: true,
            nickname: nickname,
            profileCID: profileCID,
            coverCID: coverCID,
            bioCID: bioCID,
            likesReceived: 0,
            likesGiven: 0,
            followers: 0,
            following: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit ProfileCreated(user, nickname);
    }

    // Implementación interna para actualizar un perfil
    function _updateProfile(
        address user,
        string memory nickname,
        string memory profileCID,
        string memory coverCID,
        string memory bioCID
    ) internal {
        Profile storage profile = profiles[user];

        profile.nickname = nickname;
        
        // Actualizar CIDs solo si se proporcionan nuevos valores
        if (bytes(profileCID).length > 0) {
            profile.profileCID = profileCID;
        }
        
        if (bytes(coverCID).length > 0) {
            profile.coverCID = coverCID;
        }
        
        if (bytes(bioCID).length > 0) {
            profile.bioCID = bioCID;
        }
        
        profile.updatedAt = block.timestamp;

        emit ProfileUpdated(user, nickname);
    }

    // Implementación interna para seguir a un usuario
    function _followUser(address follower, address userToFollow) internal {
        require(follower != userToFollow, "Cannot follow yourself");
        require(!isFollowing[follower][userToFollow], "Already following");

        // Actualizar estructuras de datos
        userFollowers[userToFollow].push(follower);
        userFollowing[follower].push(userToFollow);
        isFollowing[follower][userToFollow] = true;

        // Actualizar contadores
        if (profiles[userToFollow].exists) {
            profiles[userToFollow].followers++;
        }
        
        if (profiles[follower].exists) {
            profiles[follower].following++;
        }

        emit UserFollowed(follower, userToFollow);
    }

    // Implementación interna para dejar de seguir a un usuario
    function _unfollowUser(address follower, address userToUnfollow) internal {
        require(isFollowing[follower][userToUnfollow], "Not following");

        // Eliminar de la lista de following
        address[] storage following = userFollowing[follower];
        for (uint256 i = 0; i < following.length; i++) {
            if (following[i] == userToUnfollow) {
                // Reemplazar con el último elemento y eliminar el último
                following[i] = following[following.length - 1];
                following.pop();
                break;
            }
        }

        // Eliminar de la lista de followers
        address[] storage followers = userFollowers[userToUnfollow];
        for (uint256 i = 0; i < followers.length; i++) {
            if (followers[i] == follower) {
                followers[i] = followers[followers.length - 1];
                followers.pop();
                break;
            }
        }

        isFollowing[follower][userToUnfollow] = false;

        // Actualizar contadores
        if (profiles[userToUnfollow].exists) {
            profiles[userToUnfollow].followers--;
        }
        
        if (profiles[follower].exists) {
            profiles[follower].following--;
        }

        emit UserUnfollowed(follower, userToUnfollow);
    }

    // ========== FUNCIONES VIEW ==========

    // Verificar si un perfil existe
    function hasProfile(address user) external view returns (bool) {
        return profiles[user].exists;
    }

    // Obtener perfil completo
    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    // Obtener seguidores de un usuario
    function getFollowers(address user) external view returns (address[] memory) {
        return userFollowers[user];
    }

    // Obtener usuarios que un usuario sigue
    function getFollowing(address user) external view returns (address[] memory) {
        return userFollowing[user];
    }

    // Obtener recuento de seguidores
    function getFollowerCount(address user) external view returns (uint32) {
        return profiles[user].followers;
    }

    // Obtener recuento de usuarios seguidos
    function getFollowingCount(address user) external view returns (uint32) {
        return profiles[user].following;
    }
}
