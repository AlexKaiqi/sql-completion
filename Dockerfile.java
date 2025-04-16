FROM openjdk:17-jdk-slim

WORKDIR /app

# 假设您的Java项目使用Maven构建
COPY pom.xml .
COPY src ./src

# 如果您使用Maven
RUN apt-get update && apt-get install -y maven
RUN mvn clean package -DskipTests

# 假设您的JAR文件在target目录中
EXPOSE 8080

CMD ["java", "-jar", "target/your-app.jar"] 