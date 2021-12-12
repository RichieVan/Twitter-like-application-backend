import sqlz from 'sequelize';
const {DataTypes} = sqlz;

export default {
    modelName : 'token',
    attributes: {
        id : {
            type: DataTypes.INTEGER,
            autoIncrement: true, 
            primaryKey: true,
            allowNull: false
        },
        refreshToken : {
            type: DataTypes.STRING(1000)
        }
    },
    props : {
        timestamps: true
    }
};