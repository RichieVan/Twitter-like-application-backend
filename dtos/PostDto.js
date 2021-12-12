export default class PostDto {
    id;
    createdAt;
    updatedAt;
    textContent;
    user;
    commentsCount;
    likesCount;
    currentUserLike;

    constructor(postData, userData) {
        this.id = postData.id;
        this.createdAt = postData.createdAt;
        this.updatedAt = postData.updatedAt;
        this.textContent = postData.textContent;
        this.user = {
            id : userData.id,
            login : userData.login,
            username : userData.username,
            avatar : userData.avatar,
        }
        this.commentsCount = postData.commentsCount;
        this.likesCount = postData.likesCount;
        this.currentUserLiked = postData.currentUserLiked;
    }
}