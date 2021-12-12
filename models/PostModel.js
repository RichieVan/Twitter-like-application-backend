import sqlz from 'sequelize';
const {DataTypes} = sqlz;

export default {
    modelName : 'post',
    attributes: {
        id : {
            type: DataTypes.INTEGER,
            autoIncrement: true, 
            primaryKey: true,
            allowNull: false
        },
        type : {
            type: DataTypes.STRING,
            defaultValue : 'post',
            allowNull: false
        },
        textContent: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        currentUserLiked : {
            type: DataTypes.VIRTUAL,
            default: false
        },
    }
};