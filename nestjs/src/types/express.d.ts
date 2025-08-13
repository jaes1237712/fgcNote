import { Request } from 'express';
import { UserDto } from 'src/user/dto/user.dto';

// 使用 declare global 和 namespace Express 來擴展 Express 的 Request 介面
declare global {
  namespace Express {
    interface Request {
      // 這裡定義了 Request 物件現在可以擁有一個 user 屬性
      // ? 表示它是可選的，因為不是所有請求都會經過身份驗證
      user?: UserDto;
    }
  }
}
