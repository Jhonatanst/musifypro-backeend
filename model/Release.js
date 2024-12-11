// models/Release.js
module.exports = (sequelize, DataTypes) => {
    const Release = sequelize.define('Release', {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artistName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      songFile: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    });
  
    return Release;
  };
  