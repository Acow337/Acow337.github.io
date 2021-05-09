---
title: mysql笔记
date: 2021-05-09 11:48:01
tags:
typora-copy-images-to: ./用Typora写Hexo博客
categories: mysql
---



### 连接数据库

命令行连接：

```sql
mysql -uroot -p //连接数据库

flush privileges; --刷新权限

show databases; --查看所有数据库

use school； --切换数据库use数据库名

show tables； --查看数据库中所有的表
describe student； --显示数据库中所有表的信息

create database westos； --创建一个数据库

exit； --退出连接
```

### 操作数据库

```
CREATE DATABASE if not exists hello

DROP DATABASE IF EXISTS hello //删除

USE 123  //使用
```





建表：

```sql
create table if not exists `student` (
`id` int(4) not null auto_increment comment `学号`,
`name` varchar(30) not null default `匿名` comment `学号`,
`pwd` varchar(30) not null default `123456` comment `密码`,
`sex` varchar(30) not null default `女` comment `性别`,
`birthday` datetime default null comment `出生日期`,
primary key(`id`)
)engine=innodb default charset=utf8
```



常用命令：

```
show create database school --查看创建数据库的语句
show create table student --查看student数据表的定义语句
desc student --查看表的结构
```



修改操作

```sql
ALTER TABLE teacher RENAME AS teacher1 --修改表名
ALTER TABLE teacher ADD age INT(11) --增加表的字段
ALTER TABLE teacher1 MODIFY age VARCHAR(11) --修改表的字段（重命名）
ALTER TABLE tescher1 CHANGE age age1 INT(1) --修改约束
ALTER TABLE teacher1 DROP age1 --删除表的字段

DROP TABLE IF EXISTS teacher1 --删除表
```





外键：



注：删除有外键关系的表的时候，必须要先删除引用别人的表（从表），再删除被引用的表（主表）



```sql
--创建表的时候没有外键关系（添加外键）
ALTER TABLE `student`
ADD CONSTRAINT `FK_gradeid` FOREIGN KEY(`gradeid`) REFERENCES `grade`(`gradeid`);
```



### DML语言



添加：

```sql
INSERT INTO `grade`(`gradename`) VALUES(`大四`)
INSERT INTO `grade`(`gradename`) VALUES(`大四`),(`大二`)
INSERT INTO `grade`(`gradename`,`gradeid`) VALUES(`大四`,2)
```

修改：

```sql
--修改学员名字
UPDATE `student` SET `name`=`小明`,`email`=`1123@qq.com` WHERE id=1;
UPDATE `student` SET `name`=`小明`,`email`=`1123@qq.com` WHERE id BETWEEN 2 AND 5;
UPDATE `student` SET `name`=`小明`,`email`=`1123@qq.com` WHERE id=1 AND sex=`女`;
```

删除：

```
TRUNCATE `student`  --清空student表

DELETE FROM `student` WHERE id=1;
```

查询：

```sql
--查询全部
SELECT * FROM student
--查询指定字段
SELECT `StudentNo`,`StudentName` FROM student
--别名，给结果起一个名字
SELECT `StudentNo` AS 学号,`StudentName` AS 学生姓名 FROM student AS S
-- 函数 Concat(a,b)
SELECT CONCAT(`姓名`，StudentName) AS 新名字 FROM student

SELECT studentNo,`StudentResult` FROM result 
WHERE NOT studentNo=1000
```

去重：

```sql
SELECT * FROM result   -- 查询全部的考试成绩
SELECT `StudentNo` FROM result   --查询有哪些同学参加了考试
SELECT DISTINCT `StudentNo` FROM result  --发现重复数据，查重
```



考试成绩+1分查看

```sql
SELECT `StudentNo`,`StudentResult`+1 AS `提分后` FROM result
```





### 模糊查询

```sql
--查询姓刘的同学
--like结合 %（代表0到任意个字符） 
SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentName LIKE `刘%`

--查询姓刘的同学，后面只带一个字的
SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentName LIKE `刘_`

--查询姓刘的同学，后面只带两个字的
SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentName LIKE `刘__`

--查询名字中间有嘉字的同学
SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentName LIKE `%嘉%`

```



```sql
--查询1001，1002，1003号成员
SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentNo IN (1001,1002,1003);

SELECT `StudentNo`,`StudentName` FROM `student`
WHERE StudentNo IS NULL;
```



### 联表查询

```sql
--查询参加了考试的同学
SELECT * FROM student
SELECT * FROM result

/* 思路
1.分析需求，分析查询的字段来自哪些表，（连接查询）
2.确定使用哪种连接查询？ 7种
确定交叉点（这两个表中哪个数据是相同的）
判断的条件：学生表中的studentNo = 成绩表 studentNo
*/

SELECT s.studentNO,studentName,SubjectNo,StudentResult
FROM student AS s
INNER JOIN result AS r
WHERE s.studentNO = r.studentNO

-- Right Join
SELECT s.studentNO,studentName,SubjectNo,StudentResult
FROM student AS r
RIGHT JOIN result AS r
ON s.studentNO = r.studentNO

-- Left Join
SELECT s.studentNO,studentName,SubjectNo,StudentResult
FROM student r
LEFT JOIN result r
ON s.studentNO = r.studentNO



--如：查询学员所属的年级（学号，学生的姓名，年级名称）
SELECT studentNo,studentName,`GradeName`
FROM student s
INNER JOIN `grade` g
ON s.`GradeID` = g.`GradeID`
```



自连表：

自己的表和自己的表连接，核心：一张表拆为两张一样的表即可

```sql
--查询父子信息
SELECT a.`categoryName` AS `父栏目`,b.`categoryName` AS `子栏目`
FROM `category` AS a,`category` AS b
WHERE a.`categoryid`=b.`pid`
```



### 分页和排序

```sql
SELECT studentNo,studentName,`GradeName`
FROM student s
INNER JOIN `grade` g
ON s.`GradeID` = g.`GradeID`
ORDER BY StudentNo DESC  //降序

SELECT studentNo,studentName,`GradeName`
FROM student s
INNER JOIN `grade` g
ON s.`GradeID` = g.`GradeID`
ORDER BY StudentNo ASC
LIMIT 0，5 //0指的是当前页，5指的是页面的大小

--第一页 limit 0,5
--第二页 limit 5,5
--第三页 limit 10,5
...
```



子查询：

```sql
-- 查询 数据库结构-1 的所有考试结果
-- 方式一：使用连接查询
SELECT `StudentNo`,r.`SubjectNo`,`StudentResult`
FROM `result` r
INNER JOIN `subject` sub
ON r.SubjectNo = sub.SubjectNo
WHERE SubjectName = `数据库结构-1`
ORDER BY StudentResult DESC

-- 方式二：使用子查询（由里及外）
SELECT `StudentNo`,`SubjectNo`,`StudentResult`
FROM `result`
WHERE SubjectNo = (
		SELECT SubjectNo FROM `subject`
		WHERE SubjectName = '数据库结构-1'
)
ORDER BY StudentResult DESC

SELECT StudentNo,StudentName FROM student WHERE StudentNo IN (
    SELECT StudentNo FROM result WHERE StudentResult>80 AND SubjectNo = (
    	SELECT SubjectNo FROM `subject` WHERE `subjectName` = `高等数学-2`
    )
)
```



### MySQL函数

```sql
--数学运算
SELECT ABS(-8)
SELECT CEILING(9.4)
SELECT FLOOR(9.4)
SELECT RAND()
SELECT SIGN(-10) --判断一个数的符号 负数返回-1 正数返回1 0返回0

--字符串函数
SELECT CHAR_LENGTH(`即使再小的帆也能远航`)  --字符串长度
SELECT CONCAT('A','B','C') --拼接字符串
SELECT INSERT('ABCD',1,2,'LLLL')--查询，替换 -- 换成LLLLCD(从某个位置开始替换某个长度)
SELECT LOWER(...)
SELECT UPPER(...)
SELECT INSTR('abcdefg','c') --返回3
SELECT REPLACE('ABCDEF','CD','cd')
SELECT SUBSTR('ABCDEF',3,2) --返回CD  截取开始的位置，截取的长度（长度没给就截取到头）
SELECT REVERSE(...)

--例子
SELECT REPLACE(studentname,'周','邹') FROM student
WHERE studentname LIKE `周%`

--时间与日期函数
SELECT CURRENT_DATE() --获取当前日期
SELECT CURDATE() --获取当前日期
SELECT NOW() --获取当前的时间
SELECT LOCALTIME() --本地时间
SELECT SYSDATE() --系统时间

--系统
SELECT SYSTEM_USER()
SELECT USER()
SELECT VERSION()

```





聚合函数：

```sql
SELECT COUNT(studentname) FROM student; --Count(指定列) ,会忽略所有的null值
SELECT COUNT(*) FROM student; --Count(*) ，不会忽略null值， 本质 计算行数
SELECT COUNT(1) FROM result; --Count(1)，不会忽略null值， 本质 计算行数

SELECT SUM('StudentResult') AS 总和 FROM result
SELECT AVG('StudentResult') AS 平均分 FROM result
SELECT MAX('StudentResult') AS 最高分 FROM result
SELECT MIN('StudentResult') AS 最低分 FROM result
```





```sql
SELECT SubjectName,AVG(StudentResult) AS 平均分，MAX(StudentResult),MIN(StudentResult)
FROM result r
INNER JOIN `subject` sub
ON r.`SubjectNo` = sub.`SubjectNo`
GROUP BY r.SubjectNo --通过什么字段来分组
HAVING 平均分>80 --分组后的过滤条件
```



### 事务

事务：将一组SQL放到一个批次中去执行



事务原则：ACID 原则

原子性，一致性，隔离性，持久性  （脏读，幻读...）



原子性：针对同一个事务，要么都完成，要么都失败

一致性：针对一个事务操作前与操作后的状态一致（前后数据完整性要保证一致）

持久性：表示事务结束后的数据不随着外界原因导致数据丢失（事务一旦提交就不可逆了）

隔离性：针对多个用户同时操作，主要是排除其他事务对本次事务的影响

（多个用户并发访问数据库时，数据库为每一个用户开启的事务，不能被其他事务的操作所干扰，不同事务要相互隔离）



隔离所导致的问题：



脏读：一个事务读取了另外一个事务未提交的数据

不可重复读：在一个事务内读取表中的某一行数据，多次读取结果不同。

（这个不一定是错误，只是某些场合不对）

幻读:一个事务内读取到了别的事务插入的数据，导致前后读取不一致

（一般是行影响，多了一行）



```sql
--mysql 是默认开启事务自动提交的
SET autocommit =0 /*关闭*/
SET autocommit =1 /*开启（默认的）*/

--收到处理事务
SET autocommit = 0 --关闭自动提交

--事务开启
START TRANSACTION --标记一个事务的开始，从这个之后的sql都在同一个事务内

--提交：持久化（成功！）
COMMIT
--回滚：回到原来的样子（失败！）
ROLLBACK

--事务结束
SET autocommit = 1 --开启自动提交

--了解
SAVEPOINT 保存点名 --设置一个事务的保存点
ROLLBACK TO SAVEPOINT 保存点名 --回滚到保存点
RELEASE SAVEPOINT 保存点名 -- 撤销保存点 
```





```sql
CREATE DATABASE shop CHARACTER SET utf8 COLLATE utf8_general_ci
USE shop

CREATE TABLE `account`(
`id` INT(3) NOT NULL AUTO_INCREMENT,
`name` VARCHAR(30) NOT NULL,
`money` DECIMAL(9,2) NOT NULL,
PRIMARY KEY (`id`)
)ENGINE=INNODB DEFAULT CHARSET=utf8

INSERT INTO account(`name`,`money`)
VALUES ('A',2000.00),(`B`,10000.00)

--模拟转账：事务
SET autocommit = 0;--关闭自动提交
START TRANSACTION --开启一个事务

UPDATE account SET money=money-500 WHERE `name`=`A` --A减500
UPDATE account SET money=money+500 WHERE `name`=`B` --A加500

COMMIT; --提交事务，就被持久化了
ROLLBACK; --回滚

SET autocommit = 1; --恢复默认值 
```



### 索引



索引的分类：

主键索引（PRIMARY KEY)  --唯一的标识，主键不可重复

唯一索引  (UNIQUE KEY)  --避免重复的列的出现，唯一索引可以重复

常规索引  (KEY/INDEX) --默认的，index. key关键字来设置

全文索引  (FullText)  --快速定位数据



```sql
--索引的使用
--1.在创建表的时候给字段增加索引
--2.创建完毕后，增加索引

--显示所有的索引信息
SHOW INDEX FROM student

--增加一个全文索引(索引名) 列名
ALTER TABLE school.student ADD FULLTEXT INDEX `studentName`(`studentName`);

--EXPLAIN 分析sql执行的状况

EXPLAIN SELECT * FROM student; --非全文索引

EXPLAIN SELECT * FROM student WHERE MATCH(studentName) AGAINST(`刘`);
```



测试索引

```sql
CREATE INDEX id_app_user_name ON app_user(`name`); 
-- CREATE INDEX 索引名 ON 表（字段）

SELECT * FROM app_user WHERE `name`=`用户9999`; --0.001 sec
```





### 权限管理和备份



```
--创建用户
CREATE USER acow IDENTIFIED BY `123456`

--修改密码（修改当前用户密码）
SET PASSWORD=PASSWORD(`111111`)

--修改密码（修改指定用户密码）
SET PASSWORD FOR acow = PASSWORD(`111111`)

--重命名
RENAME USER acow TO acow337

--用户授权
GRANT ALL PRIVILEGES ON *.* TO acow337

--查询权限
SHOW GRANTS FOR acow337
SHOW GRANTS FOR root@localhost

--ROOT用户权限：GRANT ALL PRIVILEGES ON *.* TO `root`@`localhost` WITH GRANT OPTION

--撤销权限 REVOKE 
REVOKE ALL PRIVILEGES ON *.* FROM acow337

--删除用户
DROP USER acow337
```



### MySQL备份



```cmd
--导出数据表（school是库名，student和result是表名）
mysqldump -hlocalhost -uroot -p123456 school student result>D:/a.sql

--导入
mysql -uroot -p123456
use school
source d:/a.sql

或者：
mysql -u用户名 -p密码 库名<备份文件
```





### 三大范式

第一范式：要求数据库表的每一列都是不可分割的原子数据项



（前提：满足第一范式）

第二范式：数据库表的每一列都和主键相关，而不能只与主键的某一部分相关（主要针对联合主键而言）

 

（前提：满足第一 二范式）

第三范式：确保数据表中的每一列数据都和主键直接相关，而不能间接相关



### JDBC

加载驱动->输入用户信息->创建连接->创建执行类->编写SQL语句->执行语句->释放连接

```
package com.acow;

import java.sql.*;

	public class practice01 {
    public static void main(String[] args) throws ClassNotFoundException, SQLException {
        //1.加载驱动
        //DriverManager.registerDriver(new com.mysql.jdbc.Driver()); 不推荐这么用
       Class.forName("com.mysql.jdbc.Driver"); //固定写法，加载驱动

        //2.用户信息和url
        String   url="jdbc:mysql://localhost:3306/jdbcstudyuseUnicode=true&characterEncoding=utf8&useSSL=true";
        String username="root";
        String password="123456";

        //3.连接成功，数据库对象 Connection 代表数据库
        Connection connection=DriverManager.getConnection(url,username,password);

        //4.执行SQL的对象 Statement 执行sql的对象（执行类）
        Statement statement = connection.createStatement();
       

        //5.执行SQL的对象，去执行SQL，可能存在结果，查看返回结果
        String sql="SELECT * FROM users";  //编写SQL

        ResultSet resultSet = statement.executeQuery(sql);//返回的结果集,结果集中封装了我们全部的查询出来的结果
        
        while(resultSet.next()){
            System.out.println("id="+resultSet.getObject("id"));
            System.out.println("id="+resultSet.getObject("NAME"));
            System.out.println("id="+resultSet.getObject("PASSWORD"));
        }
        
        //6.释放连接（必做！！）
        resultSet.close();
        statement.close();
        connection.close();
        
        
    }

```





```
statement.executeQuery(); //查询操作返回ResultSet
statement.execute(); //执行任何的SQL
statement.executeUpdate(); //更新 插入 删除 都是用这个 返回一个收影响的行数         
```



```
resultSet.getObject();  //在不知道列类型的情况下使用
resultSet.getString();
resultSet.getInt();
resultSet.getFloat();
resultSet.getDate();

resultSet.beforeFirst(); //移动到最前面
resultSet.afterLast(); //移动到最后面
resultSet.next(); //移动到下一个数据
resultSet.previous(); //移动到前一行
resultSet.absolute(row); //移动到指定行
```







在目录下创建文件db.properties

```java
driver=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/jdbcstudy
username=root
password=123456
```



编写工具类：

```java
package com.acow;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.util.Properties;

import static java.lang.System.getProperty;

public class JdbcUtils {
    
    private static String driver =null;
    private static String url =null;
    private static String username =null;
    private static String password =null;

    static {
        try{
           InputStream in = JdbcUtils.class.getClassLoader().getResourceAsStream("db.properties");
            Properties properties = new Properties();
            properties.load(in);
            
           driver= properties.getProperty("driver");
           url= properties.getProperty("url");
           username= properties.getProperty("username");
           password= properties.getProperty("password");

           //驱动只用加载一次 
           Class.forName(driver);

        }catch (IOException | ClassNotFoundException e){
            e.printStackTrace();
        }
        
    }
    
    //获取连接
    public static Connection getConnection() throws SQLException {
        
        return DriverManager.getConnection(url,username,password);
    }
    
    //释放连接资源
    public static void release(Connection conn, Statement st, ResultSet rs){
        if(rs!=null){
            try {
                rs.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
        if(st!=null){
            try {
                st.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
        if(rs!=null){
            try {
                rs.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
    }

}

```



编写增删改：

```java
package Test;
import com.acow.JdbcUtils;

import javax.xml.transform.Result;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestInsert {
    public static void main(String[] args) {
        Connection conn=null;
        Statement st=null;
        ResultSet rs=null;

        try {
            conn=JdbcUtils.getConnection(); //获取数据库连接
            st = conn.createStatement(); //获得SQL的执行对象
            String sql="INSERT INTO users(id,`NAME`,`email`,`birthday`)"+
                    "VALUES(4,'acow','123456','123qq.com','2020-01-01')";
            
            int i = st.executeUpdate(sql);
            if(i>0){
                System.out.println("插入成功！");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            JdbcUtils.release(conn,st,rs);
        }

    }
    
}
```

查询：

```java
package Test;
import com.acow.JdbcUtils;

import javax.xml.transform.Result;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestSelect {
    public static void main(String[] args) {
        Connection conn=null;
        Statement st=null;
        ResultSet rs=null;

        try {
            conn=JdbcUtils.getConnection(); //获取数据库连接
            st = conn.createStatement(); //获得SQL的执行对象
            String sql="select * from users where id = 1";
            
            rs=st.executeQuery("sql"); //查询完会返回一个结果集
            
            while(rs.next()){
                System.out.println(rs.getString("NAME"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            JdbcUtils.release(conn,st,rs);
        }

    }

}
```



prepareStatement

```java
package Test;
import com.acow.JdbcUtils;

import javax.sql.rowset.JdbcRowSet;
import javax.xml.transform.Result;
import java.sql.*;

public class TestInsert {
    public static void main(String[] args) {
        Connection conn=null;
        PreparedStatement st=null;

        try {
            conn = JdbcUtils.getConnection();
            
            //区别
            //使用？占位符代替参数
            String sql = "insert into users(id,`NAME`,`PASSWORD`,`email`,`birthday`) values(?,?,?,?,?)";
            
            st = conn.prepareStatement(sql); //预编译SQL,先写sql,然后不执行
            
            //手动给参数赋值
            st.setInt(1,4);
            st.setString(2,"acow");
            st.setString(3,"123456");
            st.setString(4,"34221@qq.com");
            //注意点： sql.Date  数据库
            //       util.Date   Java     new Date().getTime() 获得时间戳
            st.setDate(5,new java.sql.Date(new Date().getTime()));
            
            //执行
            int i=st.executeUpdate();
            if(i>0){
                System.out.println("插入成功！");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }finally{
            JdbcUtils.release(conn,st,null);
        }
    }
}
```





```java
package Test;
import com.acow.JdbcUtils;

import javax.xml.transform.Result;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestSelect {
    public static void main(String[] args) {
        Connection conn=null;
        PreparedStatement st=null;
        ResultSet rs=null;

        try {
            conn=JdbcUtils.getConnection();
            //PreparedStatement 防止SQL注入的本质，把传递进来的参数当作字符
            //假设其中存在转义字符，比如说''就会直接被转移
            
            String sql="select * from users where id=?"; //编写SQL
            
            st = conn.prepareStatement(sql); //预编译
            
            st.setInt(1,1); //传递参数
            
            rs=st.executeQuery(); //执行
            
            if(rs.next()) {
                System.out.println(rs.getString("NAME"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            JdbcUtils.release(conn,st,rs);
        }


    }

    }

}
```





```java
package Test;

import com.acow.JdbcUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TestTransaction1 {

    public static void main(String[] args) {
        Connection conn=null;
        PreparedStatement st= null;
        ResultSet rs=null;

        try {
            conn= JdbcUtils.getConnection();
            //关闭数据库的自动提交，自动会开启事务
            conn.setAutoCommit(false); //开启事务
            
            String sql1="update account set money = money-100 where name='A";
            st=conn.prepareStatement(sql1);
            st.executeUpdate();
            
            String sql2="update account set money = money+100 where name='B'";
            st=conn.prepareStatement(sql1);
            st.executeUpdate();
            
            //业务完毕，提交事务
            conn.commit();
            System.out.println("成功");
            
        } catch (Exception e) {
            try {
                conn.rollback(); //如果失败则回滚事务
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            JdbcUtils.release(conn,st,rs);
        }
    }
}
```