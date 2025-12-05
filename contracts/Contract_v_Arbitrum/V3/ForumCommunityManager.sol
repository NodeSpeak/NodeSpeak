// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommon.sol";

contract ForumCommunityManager {
    address public forumContract;

    struct Community {
        uint32 id;
        address creator;
        string contentCID; // IPFS CID para nombre y descripción
        string[] topics; // Tópicos específicos de esta comunidad
        string profileCID; // IPFS CID para la foto de perfil de la comunidad
        string coverCID; // IPFS CID para la foto de portada de la comunidad
        uint32 postCount;
        bool isActive;
    }

    // Contador de comunidades
    uint32 private communityCounter;

    // Mappings relacionados con comunidades
    mapping(uint32 => Community) public communities;
    mapping(uint32 => mapping(string => bool)) public communityTopics;
    mapping(uint32 => mapping(address => bool)) public communityMembers;
    mapping(address => uint32[]) private userCommunities;
    mapping(uint32 => uint32) public communityMemberCount;
    mapping(address => uint256) private lastCommunityCreationTime;

    // Eventos
    event CommunityCreated(uint32 indexed communityId, address indexed creator);
    event TopicAdded(uint32 indexed communityId, string topic);
    event CommunityDeactivated(uint32 indexed communityId);
    event MemberJoined(uint32 indexed communityId, address indexed member);
    event MemberLeft(uint32 indexed communityId, address indexed member);
    event CommunityImagesUpdated(uint32 indexed communityId, string profileCID, string coverCID);

    constructor() {
        forumContract = msg.sender;
    }

    // Función para actualizar la dirección del contrato principal
    function setForumContract(address _newForumContract) external {
        require(msg.sender == forumContract, "Not authorized A");
        forumContract = _newForumContract;
    }

    // Modificadores
    modifier onlyForumContract() {
        require(msg.sender == forumContract, "Not authorized B");
        _;
    }

    modifier communityCooldown(address user) {
        require(
            block.timestamp >= lastCommunityCreationTime[user] + 5 minutes,
            "Community creation cooldown active"
        );
        _;
        lastCommunityCreationTime[user] = block.timestamp;
    }

    modifier validCommunity(uint32 communityId) {
        require(
            communityId > 0 && communityId <= communityCounter,
            "Invalid community ID"
        );
        require(communities[communityId].isActive, "Community is inactive");
        _;
    }
    
    modifier isCommunityCreator(address user, uint32 communityId) {
        require(
            user == communities[communityId].creator,
            "Not community creator"
        );
        _;
    }

    // ========== FUNCIONES PARA LLAMADAS DESDE EL CONTRATO PRINCIPAL ==========
    
    // Crear una nueva comunidad para un usuario específico (con imágenes)
    function createCommunityFor(
        address user,
        string memory contentCID,
        string[] memory initialTopics,
        string memory profileCID,
        string memory coverCID
    ) external onlyForumContract communityCooldown(user) {
        require(bytes(contentCID).length > 0, "Content CID invalid");
        require(initialTopics.length > 0, "At least one topic required");

        // Verificar que no haya tópicos duplicados
        for (uint256 i = 0; i < initialTopics.length; i++) {
            require(
                bytes(initialTopics[i]).length > 0,
                "Empty topic not allowed"
            );
            for (uint256 j = i + 1; j < initialTopics.length; j++) {
                require(
                    keccak256(abi.encodePacked(initialTopics[i])) !=
                        keccak256(abi.encodePacked(initialTopics[j])),
                    "Duplicate topics not allowed"
                );
            }
        }

        communityCounter++;

        communities[communityCounter] = Community(
            communityCounter,
            user,
            contentCID,
            initialTopics,
            profileCID,
            coverCID,
            0,
            true
        );

        // Registrar los tópicos iniciales
        for (uint256 i = 0; i < initialTopics.length; i++) {
            communityTopics[communityCounter][initialTopics[i]] = true;
        }

        emit CommunityCreated(communityCounter, user);

        // El creador se convierte automáticamente en miembro
        communityMembers[communityCounter][user] = true;
        userCommunities[user].push(communityCounter);
        communityMemberCount[communityCounter] = 1;

        emit MemberJoined(communityCounter, user);
    }

    // Actualizar imágenes de una comunidad
    function updateCommunityImagesFor(
        address user,
        uint32 communityId,
        string memory profileCID,
        string memory coverCID
    ) external onlyForumContract validCommunity(communityId) isCommunityCreator(user, communityId) {
        communities[communityId].profileCID = profileCID;
        communities[communityId].coverCID = coverCID;
        
        emit CommunityImagesUpdated(communityId, profileCID, coverCID);
    }

    // Añadir un nuevo tópico a una comunidad
    function addTopicToCommunityFor(
        address user,
        uint32 communityId,
        string memory topic
    ) external onlyForumContract validCommunity(communityId) isCommunityCreator(user, communityId) {
        require(
            bytes(topic).length > 0 && bytes(topic).length <= 100,
            "Topic size invalid"
        );
        require(!communityTopics[communityId][topic], "Topic already exists");

        communities[communityId].topics.push(topic);
        communityTopics[communityId][topic] = true;

        emit TopicAdded(communityId, topic);
    }

    // Unirse a una comunidad
    function joinCommunityFor(
        address user,
        uint32 communityId
    ) external onlyForumContract validCommunity(communityId) {
        require(!communityMembers[communityId][user], "Already a member");

        communityMembers[communityId][user] = true;
        userCommunities[user].push(communityId);
        communityMemberCount[communityId]++;

        emit MemberJoined(communityId, user);
    }

    // Abandonar una comunidad
    function leaveCommunityFor(
        address user,
        uint32 communityId
    ) external onlyForumContract validCommunity(communityId) {
        require(communityMembers[communityId][user], "Not a member");
        require(
            communities[communityId].creator != user,
            "Creator cannot leave"
        );

        communityMembers[communityId][user] = false;
        communityMemberCount[communityId]--;

        // Eliminar la comunidad del array de comunidades del usuario
        uint32[] storage userComms = userCommunities[user];
        for (uint256 i = 0; i < userComms.length; i++) {
            if (userComms[i] == communityId) {
                // Reemplazar con el último elemento y reducir la longitud
                userComms[i] = userComms[userComms.length - 1];
                userComms.pop();
                break;
            }
        }

        emit MemberLeft(communityId, user);
    }

    // Desactivar una comunidad
    function deactivateCommunityFor(
        address user,
        uint32 communityId
    ) external onlyForumContract validCommunity(communityId) isCommunityCreator(user, communityId) {
        communities[communityId].isActive = false;
        emit CommunityDeactivated(communityId);
    }

    // ========== NUEVAS FUNCIONES PARA "MIS COMUNIDADES" ==========
    
    // NUEVA: Obtener comunidades donde el usuario ES creador
    function getUserCreatedCommunities(address user) external view returns (Community[] memory) {
        uint32[] memory commIds = userCommunities[user];
        uint32 createdCount = 0;

        // Contar cuántas comunidades creó el usuario (que estén activas)
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && 
                communities[commId].creator == user && 
                communityMembers[commId][user]) {
                createdCount++;
            }
        }

        // Crear el array de resultado
        Community[] memory createdCommunities = new Community[](createdCount);
        uint32 currentIndex = 0;

        // Llenar el array con las comunidades creadas
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && 
                communities[commId].creator == user && 
                communityMembers[commId][user]) {
                createdCommunities[currentIndex] = communities[commId];
                currentIndex++;
            }
        }

        return createdCommunities;
    }

    // NUEVA: Obtener comunidades donde el usuario ES miembro pero NO creador
    function getUserMemberCommunities(address user) external view returns (Community[] memory) {
        uint32[] memory commIds = userCommunities[user];
        uint32 memberCount = 0;

        // Contar cuántas comunidades donde es miembro (no creador y activas)
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && 
                communities[commId].creator != user && 
                communityMembers[commId][user]) {
                memberCount++;
            }
        }

        // Crear el array de resultado
        Community[] memory memberCommunities = new Community[](memberCount);
        uint32 currentIndex = 0;

        // Llenar el array con las comunidades donde es miembro
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && 
                communities[commId].creator != user && 
                communityMembers[commId][user]) {
                memberCommunities[currentIndex] = communities[commId];
                currentIndex++;
            }
        }

        return memberCommunities;
    }

    // NUEVA: Método combinado que retorna ambos tipos separadamente
    function getUserCommunitiesDetailed(address user) external view returns (
        Community[] memory createdCommunities,
        Community[] memory memberCommunities
    ) {
        uint32[] memory commIds = userCommunities[user];
        uint32 createdCount = 0;
        uint32 memberCount = 0;

        // Primera pasada: contar
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && communityMembers[commId][user]) {
                if (communities[commId].creator == user) {
                    createdCount++;
                } else {
                    memberCount++;
                }
            }
        }

        // Crear los arrays
        createdCommunities = new Community[](createdCount);
        memberCommunities = new Community[](memberCount);
        uint32 createdIndex = 0;
        uint32 memberIndex = 0;

        // Segunda pasada: llenar los arrays
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (communities[commId].isActive && communityMembers[commId][user]) {
                if (communities[commId].creator == user) {
                    createdCommunities[createdIndex] = communities[commId];
                    createdIndex++;
                } else {
                    memberCommunities[memberIndex] = communities[commId];
                    memberIndex++;
                }
            }
        }

        return (createdCommunities, memberCommunities);
    }

    // ========== FUNCIONES DE LECTURA EXISTENTES ==========
    
    function getCommunity(
        uint32 communityId
    ) external view returns (Community memory) {
        require(
            communityId > 0 && communityId <= communityCounter,
            "Invalid community ID"
        );
        return communities[communityId];
    }

    function getActiveCommunities() external view returns (Community[] memory) {
        uint32 count = 0;

        for (uint32 i = 1; i <= communityCounter; i++) {
            if (communities[i].isActive) {
                count++;
            }
        }

        Community[] memory activeCommunities = new Community[](count);
        uint32 currentIndex = 0;

        for (uint32 i = 1; i <= communityCounter; i++) {
            if (communities[i].isActive) {
                activeCommunities[currentIndex] = communities[i];
                currentIndex++;
            }
        }

        return activeCommunities;
    }

    function getCommunityTopics(
        uint32 communityId
    ) external view validCommunity(communityId) returns (string[] memory) {
        return communities[communityId].topics;
    }

    function isCommunityTopicValid(
        uint32 communityId,
        string memory topic
    ) external view validCommunity(communityId) returns (bool) {
        return communityTopics[communityId][topic];
    }

    function isMember(
        uint32 communityId,
        address user
    ) external view validCommunity(communityId) returns (bool) {
        return communityMembers[communityId][user];
    }

    function getUserCommunities(
        address user
    ) external view returns (uint32[] memory) {
        return userCommunities[user];
    }

    function getUserActiveCommunities(
        address user
    ) external view returns (Community[] memory) {
        uint32[] memory commIds = userCommunities[user];
        uint32 activeCount = 0;

        // Primero contamos cuántas comunidades activas tiene el usuario
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (
                communities[commId].isActive && communityMembers[commId][user]
            ) {
                activeCount++;
            }
        }

        // Creamos el array de resultado
        Community[] memory activeCommunities = new Community[](activeCount);
        uint32 currentIndex = 0;

        // Llenamos el array con las comunidades activas
        for (uint256 i = 0; i < commIds.length; i++) {
            uint32 commId = commIds[i];
            if (
                communities[commId].isActive && communityMembers[commId][user]
            ) {
                activeCommunities[currentIndex] = communities[commId];
                currentIndex++;
            }
        }

        return activeCommunities;
    }

    function getCommunityMemberCount(
        uint32 communityId
    ) external view validCommunity(communityId) returns (uint32) {
        return communityMemberCount[communityId];
    }

    // Incrementar el contador de posts de una comunidad
    function incrementPostCount(
        uint32 communityId
    ) external validCommunity(communityId) {
        communities[communityId].postCount++;
    }

    // Validar un topic para una comunidad
    function validateTopicForCommunity(
        uint32 communityId,
        string memory topic
    ) external view validCommunity(communityId) returns (bool) {
        return communityTopics[communityId][topic];
    }

    // Obtener el contador actual de comunidades
    function getCommunityCounter() external view returns (uint32) {
        return communityCounter;
    }

    // NUEVA: Verificar si un usuario es creador de una comunidad
    function isUserCommunityCreator(address user, uint32 communityId) external view validCommunity(communityId) returns (bool) {
        return communities[communityId].creator == user;
    }
}