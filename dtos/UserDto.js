export default class UserDto {
    id;
    email;
    login;
    username;
    isActivated;
    role;
    about;
    avatar;

    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.login = data.login;
        this.username = data.username; 
        this.isActivated = data.isActivated; 
        this.role = data.role; 
        this.about = data.about ?? ''; 
        this.currentUserSubscribed = data.currentUserSubscribed; 
        this.avatar = {
            name : data.avatar,
            url : data.avatar !== 'default' 
                ? process.env.IMG_URL + `/${data.avatar}.png` 
                : process.env.IMG_URL + `/${process.env.IMG_DEFAULT_HASH}.png`
        };
    }
}