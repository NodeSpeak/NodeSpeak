// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ForumCommon.sol";
import "./ForumCommunityManager.sol";

contract ForumPostManager {
    address public forumContract;
    
    struct Post {
        uint32 id;
        address author;
        string title;
        string contentCID;
        string imageCID;
        string topic;
        uint32 communityId;
        uint32 likeCount;
        uint32 dislikeCount;
        uint32 commentCount;
        uint256 timestamp;
        bool isActive;
    }

    struct Comment {
        uint32 id;
        address author;
        string content;
        uint32 quotedCommentId;
        uint256 timestamp;
        bool isActive;
    }

    // Referencia al contrato de comunidades
    ForumCommunityManager private communityManager;

    // Contadores
    uint32 private postCounter;
    uint32 private commentCounter;
    
    // Mappings existentes
    mapping(uint32 => Post) public posts; 
    mapping(uint32 => Comment[]) public comments;
    mapping(uint32 => mapping(address => bool)) public postLikes;
    mapping(address => uint256) private lastPostTime;

    // Dislikes
    mapping(uint32 => mapping(address => bool)) public postDislikes; // Tracking de dislikes por post por usuario

    // Eventos existentes
    event PostCreated(
        uint32 indexed postId,
        uint32 indexed communityId,
        address indexed author,
        string topic
    );
    
    event CommentAdded(
        uint32 indexed postId,
        uint32 indexed commentId,
        address indexed author
    );
    
    event PostLiked(uint32 indexed postId, address indexed liker);
    
    event PostDeactivated(uint32 indexed postId);
    
    event CommentDeactivated(uint32 indexed postId, uint32 indexed commentId);

    // NUEVOS Eventos
    event PostDisliked(uint32 indexed postId, address indexed disliker);
    event PostLikeRemoved(uint32 indexed postId, address indexed user);
    event PostDislikeRemoved(uint32 indexed postId, address indexed user);
    event CommentQuoted(uint32 indexed postId, uint32 indexed commentId, uint32 indexed quotedCommentId);

    // Constructor que recibe la dirección del contrato de comunidades
    constructor(address communityManagerAddress) {
        communityManager = ForumCommunityManager(communityManagerAddress);
        forumContract = msg.sender;
    }

    // Función para actualizar la dirección del contrato principal
    function setForumContract(address _newForumContract) external {
        require(msg.sender == forumContract, "Not authorized 1");
        forumContract = _newForumContract;
    }

    // Modificadores
    modifier onlyForumContract() {
        require(msg.sender == forumContract, "Not authorized 2");
        _;
    }

    modifier cooldown(address user) {
        require(
            block.timestamp >= lastPostTime[user] + 1 minutes,
            "Cooldown active"
        );
        _;
        lastPostTime[user] = block.timestamp;
    }

    modifier validContent(
        string memory contentCID,
        string memory topic,
        string memory title
    ) {
        require(
            bytes(title).length > 0 && bytes(title).length <= 100,
            "Title size invalid"
        );
        require(bytes(contentCID).length > 0, "Content CID invalid");
        require(
            bytes(topic).length > 0 && bytes(topic).length <= 100,
            "Topic size invalid"
        );
        _;
    }

    modifier validPost(uint32 postId) {
        require(postId > 0 && postId <= postCounter, "Invalid post ID");
        require(posts[postId].isActive, "Post is inactive");
        _;
    }
    
    // ========== FUNCIONES PARA LLAMADAS DIRECTAS ==========
    // Estas funciones siguen existiendo para mantener compatibilidad

    // Crear un post en una comunidad
    function createPost(
        uint32 communityId,
        string memory title,
        string memory contentCID,
        string memory imageCID,
        string memory topic
    ) external cooldown(msg.sender) validContent(contentCID, topic, title) {
        _createPost(msg.sender, communityId, title, contentCID, imageCID, topic);
    }

    function likePost(uint32 postId) external {
        _likePost(msg.sender, postId);
    }

    // NUEVA: Dar dislike a un post
    function dislikePost(uint32 postId) external {
        _dislikePost(msg.sender, postId);
    }

    // NUEVA: Quitar like de un post
    function removeLike(uint32 postId) external {
        _removeLike(msg.sender, postId);
    }

    // NUEVA: Quitar dislike de un post
    function removeDislike(uint32 postId) external {
        _removeDislike(msg.sender, postId);
    }

    function addComment(uint32 postId, string memory content) external {
        _addComment(msg.sender, postId, content, 0); // 0 = no cita ningún comentario
    }

    // NUEVA: Agregar comentario citando otro comentario
    function addCommentWithQuote(uint32 postId, string memory content, uint32 quotedCommentId) external {
        _addComment(msg.sender, postId, content, quotedCommentId);
    }

    function deactivatePost(uint32 postId) external {
        _deactivatePost(msg.sender, postId);
    }

    function deactivateComment(uint32 postId, uint32 commentId) external {
        _deactivateComment(msg.sender, postId, commentId);
    }
    
    // ========== FUNCIONES PARA LLAMADAS DESDE EL CONTRATO PRINCIPAL ==========
    
    // Crear un post para un usuario específico
    function createPostFor(
        address user,
        uint32 communityId,
        string memory title,
        string memory contentCID,
        string memory imageCID,
        string memory topic
    ) external onlyForumContract cooldown(user) validContent(contentCID, topic, title) {
        _createPost(user, communityId, title, contentCID, imageCID, topic);
    }

    function likePostFor(address user, uint32 postId) external onlyForumContract {
        _likePost(user, postId);
    }

    function dislikePostFor(address user, uint32 postId) external onlyForumContract {
        _dislikePost(user, postId);
    }

    function addCommentFor(address user, uint32 postId, string memory content) external onlyForumContract {
        _addComment(user, postId, content, 0);
    }

    function addCommentWithQuoteFor(address user, uint32 postId, string memory content, uint32 quotedCommentId) external onlyForumContract {
        _addComment(user, postId, content, quotedCommentId);
    }

    function deactivatePostFor(address user, uint32 postId) external onlyForumContract {
        _deactivatePost(user, postId);
    }

    function deactivateCommentFor(address user, uint32 postId, uint32 commentId) external onlyForumContract {
        _deactivateComment(user, postId, commentId);
    }
    
    // ========== FUNCIONES INTERNAS ==========
    
    // Implementación interna para crear un post
    function _createPost(
        address author,
        uint32 communityId,
        string memory title,
        string memory contentCID,
        string memory imageCID,
        string memory topic
    ) internal {
        // Verificar que el topic sea válido para la comunidad
        require(communityManager.validateTopicForCommunity(communityId, topic), 
            "Topic not allowed in this community");
        
        postCounter++;
        posts[postCounter] = Post(
            postCounter,
            author,
            title,
            contentCID,
            imageCID,
            topic,
            communityId,
            0, // likeCount
            0, // dislikeCount - NUEVO
            0, // commentCount
            block.timestamp,
            true
        );
        
        // Incrementar contador de posts en la comunidad
        communityManager.incrementPostCount(communityId);
        
        emit PostCreated(postCounter, communityId, author, topic);
    }

    // Implementación interna para dar like a un post
    function _likePost(address user, uint32 postId) internal validPost(postId) {
        require(!postLikes[postId][user], "You have already liked this post");

        // Si el usuario ya dio dislike, quitamos el dislike primero
        if (postDislikes[postId][user]) {
            postDislikes[postId][user] = false;
            posts[postId].dislikeCount--;
        }

        postLikes[postId][user] = true;
        posts[postId].likeCount++;

        emit PostLiked(postId, user);
    }

    // NUEVA: Implementación interna para dar dislike a un post
    function _dislikePost(address user, uint32 postId) internal validPost(postId) {
        require(!postDislikes[postId][user], "You have already disliked this post");

        // Si el usuario ya dio like, quitamos el like primero
        if (postLikes[postId][user]) {
            postLikes[postId][user] = false;
            posts[postId].likeCount--;
        }

        postDislikes[postId][user] = true;
        posts[postId].dislikeCount++;

        emit PostDisliked(postId, user);
    }

    // NUEVA: Implementación interna para quitar like
    function _removeLike(address user, uint32 postId) internal validPost(postId) {
        require(postLikes[postId][user], "You have not liked this post");

        postLikes[postId][user] = false;
        posts[postId].likeCount--;

        emit PostLikeRemoved(postId, user);
    }

    // NUEVA: Implementación interna para quitar dislike
    function _removeDislike(address user, uint32 postId) internal validPost(postId) {
        require(postDislikes[postId][user], "You have not disliked this post");

        postDislikes[postId][user] = false;
        posts[postId].dislikeCount--;

        emit PostDislikeRemoved(postId, user);
    }

    // Implementación interna para añadir un comentario (modificada para soportar citas)
    function _addComment(address user, uint32 postId, string memory content, uint32 quotedCommentId) internal validPost(postId) {
        require(bytes(content).length > 0, "Comment content cannot be empty");

        // Si se está citando un comentario, verificar que existe y está activo
        if (quotedCommentId > 0) {
            Comment[] memory postComments = comments[postId];
            require(quotedCommentId <= postComments.length, "Quoted comment does not exist");
            require(postComments[quotedCommentId - 1].isActive, "Quoted comment is inactive");
        }

        commentCounter++;
        comments[postId].push(
            Comment(commentCounter, user, content, quotedCommentId, block.timestamp, true)
        );
        posts[postId].commentCount++;

        emit CommentAdded(postId, commentCounter, user);
        
        if (quotedCommentId > 0) {
            emit CommentQuoted(postId, commentCounter, quotedCommentId);
        }
    }

    // Implementación interna para desactivar un post
    function _deactivatePost(address user, uint32 postId) internal validPost(postId) {
        require(user == posts[postId].author, "Not post owner");

        posts[postId].isActive = false;
        emit PostDeactivated(postId);
    }

    // Implementación interna para desactivar un comentario
    function _deactivateComment(address user, uint32 postId, uint32 commentId) internal {
        require(postId > 0 && postId <= postCounter, "Invalid post ID");
        
        // Verificar que el comentario exista dentro del post
        Comment[] memory postComments = comments[postId];
        require(commentId > 0 && commentId <= postComments.length, "Invalid comment ID");
        
        // Verificar que el comentario esté activo
        require(
            postComments[commentId - 1].isActive,
            "Comment already inactive"
        );
        
        // Verificar que el usuario sea el propietario del comentario
        require(
            user == postComments[commentId - 1].author,
            "Not comment owner"
        );

        comments[postId][commentId - 1].isActive = false;
        emit CommentDeactivated(postId, commentId);
    }

    // ========== NUEVAS FUNCIONES DE LECTURA ==========
    
    // NUEVA: Obtener posts recientes del creador de una comunidad
    function getRecentCreatorPosts(uint32 communityId, uint256 timeframeSeconds) external view returns (Post[] memory) {
        address creator = communityManager.getCommunity(communityId).creator;
        uint256 cutoffTime = block.timestamp - timeframeSeconds;
        
        uint32 count = 0;
        
        // Contar posts que coinciden
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && 
                posts[i].author == creator && 
                posts[i].timestamp >= cutoffTime && 
                posts[i].isActive) {
                count++;
            }
        }
        
        Post[] memory recentPosts = new Post[](count);
        uint32 currentIndex = 0;
        
        // Llenar el array
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && 
                posts[i].author == creator && 
                posts[i].timestamp >= cutoffTime && 
                posts[i].isActive) {
                recentPosts[currentIndex] = posts[i];
                currentIndex++;
            }
        }
        
        return recentPosts;
    }

    // NUEVA: Obtener posts recientes de otros usuarios (no creador)
    function getRecentNonCreatorPosts(uint32 communityId, uint256 timeframeSeconds) external view returns (Post[] memory) {
        address creator = communityManager.getCommunity(communityId).creator;
        uint256 cutoffTime = block.timestamp - timeframeSeconds;
        
        uint32 count = 0;
        
        // Contar posts que coinciden
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && 
                posts[i].author != creator && 
                posts[i].timestamp >= cutoffTime && 
                posts[i].isActive) {
                count++;
            }
        }
        
        Post[] memory recentPosts = new Post[](count);
        uint32 currentIndex = 0;
        
        // Llenar el array
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && 
                posts[i].author != creator && 
                posts[i].timestamp >= cutoffTime && 
                posts[i].isActive) {
                recentPosts[currentIndex] = posts[i];
                currentIndex++;
            }
        }
        
        return recentPosts;
    }

    // NUEVA: Verificar si un usuario dio like a un post
    function hasUserLikedPost(uint32 postId, address user) external view returns (bool) {
        return postLikes[postId][user];
    }

    // NUEVA: Verificar si un usuario dio dislike a un post
    function hasUserDislikedPost(uint32 postId, address user) external view returns (bool) {
        return postDislikes[postId][user];
    }

    // ========== FUNCIONES DE LECTURA EXISTENTES (SIN CAMBIOS) ==========
    
    function getPost(uint32 postId) external view returns (Post memory) {
        require(postId > 0 && postId <= postCounter, "Invalid post ID");
        return posts[postId];
    }

    function getComments(
        uint32 postId
    ) external view returns (Comment[] memory) {
        require(postId > 0 && postId <= postCounter, "Invalid post ID");
        return comments[postId];
    }

    function getActivePosts() external view returns (Post[] memory) {
        uint32 count = 0;
        
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].isActive) {
                count++;
            }
        }
        
        Post[] memory activePosts = new Post[](count);
        uint32 currentIndex = 0;
        
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].isActive) {
                activePosts[currentIndex] = posts[i];
                currentIndex++;
            }
        }
        
        return activePosts;
    }

    function getCommunityPosts(uint32 communityId) external view returns (Post[] memory) {
        uint32 count = 0;
        
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && posts[i].isActive) {
                count++;
            }
        }
        
        Post[] memory communityPosts = new Post[](count);
        uint32 currentIndex = 0;
        
        for (uint32 i = 1; i <= postCounter; i++) {
            if (posts[i].communityId == communityId && posts[i].isActive) {
                communityPosts[currentIndex] = posts[i];
                currentIndex++;
            }
        }
        
        return communityPosts;
    }
}