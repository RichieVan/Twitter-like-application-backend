import sqlz from 'sequelize';
const {DataTypes} = sqlz;

export default {
    modelName : 'like',
    attributes : {
        id : {
            type: DataTypes.INTEGER,
            autoIncrement: true, 
            primaryKey: true,
            allowNull: false
        }
    },
    props : {
        timestamps : false
    }
};