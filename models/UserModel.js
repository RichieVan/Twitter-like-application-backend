import sqlz from 'sequelize';
const {DataTypes} = sqlz;

export default {
    modelName : 'user',
    attributes: {
        id : {
            type: DataTypes.INTEGER,
            autoIncrement: true, 
            primaryKey: true,
            allowNull: false
        },
        username : {
            type: DataTypes.STRING,
            allowNull: false,
            validate : {
                notIn : {
                    args : [['settings', 'user', 'username', 'login', 'password', 'auth', 'authorization', 'admin']],
                    msg : 'Недопустимое имя пользователя'
                },
                len : {
                    args : [3, 28],
                    msg : 'Имя пользователя должно содержать от 3 до 28 символов'
                }
            }
        },
        password : {
            type : DataTypes.VIRTUAL,
            validate : {
                is : {
                    args : /^[a-zA-Z0-9!@#$%^&*_-]+$/i,
                    msg : 'Пароль может содержать только символы латиницы, цифры и специальные символы: !@#$%^&*_-'
                },
                len : {
                    args : [6, 60],
                    msg : 'Пароль должен содержать не меньше 6 символов'
                }
            }
        },
        passhash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        login: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            set(value) {
                let login = value.toLowerCase();
                this.setDataValue('login', login)
            }
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: {
                    msg : 'Неверный формат адреса электронной почты'
                },
            }
        },
        isActivated : {
            type: DataTypes.BOOLEAN,
            defaultValue : false,
            allowNull: false
        },
        role : {
            type: DataTypes.STRING,
            defaultValue : 'user',
            allowNull: false,
            get () {
                const rawValue = this.getDataValue('role');
                let result = {
                    val: rawValue,
                    loc_ru : ''
                } 
                
                switch (rawValue) {
                    case 'user':
                        result.loc_ru = 'Пользователь';
                        break;
                    case 'admin':
                        result.loc_ru = 'Администратор';
                        break;
                    default:
                        result.loc_ru = 'Неизвестная роль';
                        break;
                }

                return result;
            }
        },
        avatar : {
            type: DataTypes.STRING,
            defaultValue: 'default'
        },
        activationLink : {
            type: DataTypes.STRING
        },
        passRestoreLink: {
            type: DataTypes.STRING
        },
        mailResendCooldown : {
            type: DataTypes.DATE,
            allowNull: true
        },
        about: {
            type: DataTypes.TEXT
        },
        currentUserSubscribed : {
            type: DataTypes.VIRTUAL,
            default: false
        }
    }
};