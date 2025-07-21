import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

// Define attributes for User model
interface UserAttributes {
  _id: string;
  username: string;
  email: string;
  password: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (Optional fields are not required during creation)
interface UserCreationAttributes extends Optional<UserAttributes, '_id' | 'createdAt' | 'updatedAt' | 'age' | 'height' | 'weight' | 'fitnessLevel'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public _id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public age?: number;
  public height?: number;
  public weight?: number;
  public fitnessLevel?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods for password comparison
  public comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
    },
    height: {
      type: DataTypes.INTEGER,
    },
    weight: {
      type: DataTypes.INTEGER,
    },
    fitnessLevel: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);