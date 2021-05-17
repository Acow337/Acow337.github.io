---
title: JAVA并发编程基础
date: 2021-05-09 17:05:53
tags:
categories: JUC
---

#### Lock锁

1.Synchronized 内置的java关键字，Lock是一个java类

2.Synchronized无法判断获取锁的状态，Lock可以判断是否获取到了锁

3.Synchronized会自动释放锁，lock必须要手动释放锁！如果不释放锁，死锁

4.Synchronized 线程1（获得锁、阻塞）、线程2（等待、傻傻的等）；Lock锁就不一定会等待下去

5.Synchronized 可重入锁，不可以中断的、非公平；Lock，可重入锁、可以判断锁、非公平（可以自己设置）

6.Synchronized 适合锁少量的代码同步问题，Lock适合锁大量的同步代码







Condition实现精准通知唤醒

```java
//A执行完调用B，B执行完调用C，C执行完调用A

import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class C {

    public static void main(String[] args) {
        Data3 data = new Data3();

        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                data.printA();
            }
        }, "A").start();

        new Thread(()->{
            for (int i = 0; i < 10; i++) {
                data.printB();
            }
        },"B").start();

        new Thread(()->{
            for (int i = 0; i < 10; i++) {
                data.printC();
            }
        },"C").start();

    }






    static class Data3 {  //资源类Lock

        private Lock lock = new ReentrantLock();
        private Condition condition1 = lock.newCondition();
        private Condition condition2 = lock.newCondition();
        private Condition condition3 = lock.newCondition();
        private int number = 1; //1A 2B 3C

        public void printA() {
            lock.lock();
            try {
                while (number != 1) {
                    //等待
                    condition1.await();
                }
                System.out.println(Thread.currentThread().getName() + "=>AAAAAAA");
                //唤醒，唤醒指定的人，B
                number = 2;
                condition2.signal();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }

        public void printB() {
            lock.lock();
            try {
                while (number != 2) {
                    //等待
                    condition2.await();
                }
                System.out.println(Thread.currentThread().getName() + "=>BBBBBBBB");
                //唤醒，唤醒指定的人，C
                number = 3;
                condition3.signal();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }

          public void printC() {
            lock.lock();
            try {
                while (number != 3) {
                    //等待
                    condition3.await();
                }
                System.out.println(Thread.currentThread().getName() + "=>CCCCCCCCC");
                //唤醒，唤醒指定的人，A
                number = 1;
                condition1.signal();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }
    }

}
```



（List不安全）

CopyOnWriteArrayList

```java
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

public class ListTest {

    public static void main(String[] args) {

        //并发下ArrayList不安全
        /*
        解决方案：
        1.List<String> list = new Vector<>();
        2.List<String> list = Collections.synchronizedList(new ArrayList<>());
        3.List<String> list = new CopyOnWriteArrayList<>();
        */
        
        //CopyOnWrite 写入时复制 COW 计算机程序设计领域的一种优化策略;
        //多个线程调用的时候，List，读取的时候，固定的，写入时可能会出现覆盖操作
        //在写入的时候避免覆盖，造成数据问题

        List<String> list=new CopyOnWriteArrayList<>();

        for (int i = 0; i < 10; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(list);
            },String.valueOf(i)).start();
        }
    }
}
```



CopyOnWriteArraySet

```java
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArraySet;

public class SetTest {

    public static void main(String[] args) {

        Set<String> set =new HashSet<>();
        //Set<String> set = Collections.synchronizedSet(new HashSet<>());
        //Set<String> set = new CopyOnWriteArraySet<>();

        for (int i = 1; i <= 30; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(set);
            },String.valueOf(i)).start();

        }

    }
}
```



HashSet的底层是什么？

```java
public HashSet(){
	map = new HashMap<>();
}

// add set 本质就是 map key是无法重复的！
public boolean add(E e){
	return map.put(e,PRESENT)==null;
}
 
private static final Object PRESENT = new Object(); //不变的值！
```



Callable接口

```java
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;

public class CallableTest {
    public static void main(String[] args) throws ExecutionException, InterruptedException {

        //new Thread().start();//怎么启动Callable

        MyThread thread = new MyThread();
        FutureTask futureTask = new FutureTask(thread); //适配类

        new Thread(futureTask,"A").start();

        Integer o = (Integer) futureTask.get();//获取Callable的返回结果

    }

}

class MyThread implements Callable<Integer>{

    @Override
    public Integer call(){
        System.out.println("call()");
        return 1024;
    }
}
```









CountDownLatch



```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchDemo {
    public static void main(String[] args) throws InterruptedException {
        //总数是6

        CountDownLatch countDownLatch = new CountDownLatch(6);

        for (int i = 1; i <= 6; i++) {
            new Thread(()->{
                System.out.println(Thread.currentThread().getName()+"go out");
                countDownLatch.countDown(); //数量-1
            },String.valueOf(i)).start();
        }

        countDownLatch.await(); //等待计数器归零，然后再向下执行

        System.out.println("关门");

    }

}
```

​    

CyclicBarrier

```java 
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;

public class CyclicBarrierDemo {

    public static void main(String[] args) {


        CyclicBarrier cyclicBarrier = new CyclicBarrier(7, () -> {
            System.out.println("召唤神龙成功");
        });

        for (int i = 1; i <= 7; i++) {
            final int temp=i;

            int finalI = i;
            new Thread(()->{
                System.out.println(Thread.currentThread().getName()+"收集了"+ finalI +"个龙珠");
                try {
                    cyclicBarrier.await(); //等待
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            }).start();

        }
    }
}
```







Semaphore

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class SemaphoreDemo {

    public static void main(String[] args) {
        //线程数量：停车位(有三个停车位)
        Semaphore semaphore = new Semaphore(3);

        for (int i = 1; i <= 6; i++) {
            new Thread(()->{
                //acquire()得到

                try {
                    semaphore.acquire();
                    System.out.println(Thread.currentThread().getName()+"抢到车位");
                    TimeUnit.SECONDS.sleep(2);
                    System.out.println(Thread.currentThread().getName()+"离开车位");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release();//释放
                }


            },String.valueOf(i)).start();
        }


    }

}
```





ReadWriteLock

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
//独占锁（写锁） 一次只能被一个线程占用
//共享锁（读锁） 多个线程可以同时占用
public class ReadWriteLockDemo{
	public static void main(String[] args) {
		MyCacheLock myCache = new MyCacheLock();
		for (int i = 1; i <= 5; i++) {
			final int temp = i;
			new Thread(()->{
				myCache.put(temp+"",temp+"");
			}
			,String.valueOf(i)).start();
		}
		for (int i = 1; i <= 5; i++) {
			final int temp = i;
			new Thread(()->{
				myCache.get(temp+"");
			}
			,String.valueOf(i)).start();
		}
	}
}
MyCacheLock{
	private volatile Map<String,Object> map = new HashMap<>();
	private ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
	public void put(String key,Object value){
		readWriteLock.writeLock().lock();
		try {
			System.out.println(Thread.currentThread().getName()+"写入"+key);
			map.put(key,value);
			System.out.println(Thread.currentThread().getName()+"写入OK");
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		finally {
			readWriteLock.writeLock().unlock();
		}
	}
	public void get(String key){
		readWriteLock.readLock().lock();
		try {
			System.out.println(Thread.currentThread().getName()+"读取"+key);
			Object o=map.get(key);
			System.out.println(Thread.currentThread().getName()+"读取OK");
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		finally {
			readWriteLock.readLock().unlock();
		}
	}
}
```



四组API

| 方式         | 抛出异常 | 有返回值，不抛出异常 | 阻塞 等待 | 超时等待                      |
| ------------ | -------- | -------------------- | --------- | ----------------------------- |
| 添加         | add      | offer                | put       | offer(" ",2,TimeUnit.SECONDS) |
| 移除         | remove   | poll                 | take      | poll(" ",2,TimeUnit.SECONDS)  |
| 检测队首元素 | element  | peek                 |           |                               |







抛出异常:

```java
public static void main(String[] args) {
	test1();
}
public static void test1() {
	//队列的大小      
	ArrayBlockingQueue blockingQueue = new ArrayBlockingQueue<>(3);
	System.out.println(blockingQueue.add("a"));
	System.out.println(blockingQueue.add("b"));
	System.out.println(blockingQueue.add("c"));
	//IllegalStateException:Queue full 抛出异常！        
	System.out.println(blockingQueue.add("d"));
	System.out.println("============");
	System.out.println(blockingQueue.remove());
	System.out.println(blockingQueue.remove());
	System.out.println(blockingQueue.remove());
	//java.util.NoSuchElementException 抛出异常！        
	System.out.println(blockingQueue.remove());
}
}
```



SynchronousQueue同步队列：

没有容量，

进去一个元素，必须等待取出来之后，才能再往里面放一个元素！

put,take;





#### 线程池

线程池：三大方法、七大参数、四种拒绝策略

池化技术：



线程池使用案例：

```java
import java.util.concurrent.ExecutorService;import java.util.concurrent.Executors;
public class Demo01 { 
  public static void main(String[] args) {        
  ExecutorService threadPool = Executors.newSingleThreadExecutor();//单个线程       
  ExecutorService threadPool = Executors.newFixedThreadPool(5);//创建一个固定的线程池的大小        
  ExecutorService threadPool = Executors.newCachedThreadPool();//可伸缩的       
  try {           
    for (int i = 0; i < 10; i++) {                           
    threadPool.execute(()->{     
      System.out.println(Thread.currentThread().getName()+" ok");       
    });
    }     
  } catch (Exception e) {   
    e.printStackTrace();   
  } finally {            
    threadPool.shutdown();       
  }   
  }    
}
```



7大参数及自定义线程池：

```java
import java.util.concurrent.*;
//Executors 工具类，3大方法
public class Demo01 {
	public static void main(String[] args) {
		ExecutorService threadPool = new ThreadPoolExecutor(2,5,3,TimeUnit.SECONDS,new LinkedBlockingDeque<>(3),                Executors.defaultThreadFactory(),new ThreadPoolExecutor.AbortPolicy()//银行满了，还有人进来，不处理这个人的，抛出异常            
		new ThreadPoolExecutor.CallerRunsPolicy()  //哪来的去哪里！！（一般让main线程去处理）    
		new ThreadPoolExecutor.DiscardPolicy() //队列满了，丢掉任务，不会抛出异常！            
		new ThreadPoolExecutor.DiscardOldestPolicy() //队列满了，尝试去和最早的竞争，也不会抛出异常    
		);
		try {
			for (int i = 0; i < 10; i++) {
				//使用了线程池后，使用线程池来创建线程          
				threadPool.execute(()->{
					System.out.println(Thread.currentThread().getName()+" ok");
				}
				);
			}
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		finally {
			//线程池用完，程序结束，关闭线程池       
			threadPool.shutdown();
		}
	}
}
```



7大参数以及自定义线程池

```java
import java.util.concurrent.*;
// Executors 工具类，3大方法
public class Demo01 {
	public static void main(String[] args) {
		// Executors.newSingleThreadExecutor();  
		ExecutorService threadPool = new ThreadPoolExecutor(2,5,3,TimeUnit.SECONDS,new LinkedBlockingDeque<>(3),                Executors.defaultThreadFactory(), //默认的线程工厂
 new ThreadPoolExecutor.AbortPolicy()//银行满了，还有人进来，不处理这个人的，抛出异常       
		);
		try {
			for (int i = 0; i < 10; i++) {
				//使用了线程池后，使用线程池来创建线程   
				threadPool.execute(()->{
					System.out.println(Thread.currentThread().getName()+" ok");
				}
				);
			}
		}
		catch (Exception e) {
			e.printStackTrace();
		}
		finally {
			//线程池用完，程序结束，关闭线程池     
			threadPool.shutdown();
		}
	}
}
```





最大线程应该如何定义：

1.CPU密集型，几核，就是几，可以保持CPU的效率最高！

2.IO密集型， >判断你程序中十分耗IO的线程





### 四大函数式接口

1.Function

```java
import java.util.concurrent.*;
import java.util.function.Function;
// Executors 工具类，3大方法
/* Function 函数型接口，有一个输入参数，有一个输出 只要是 函数型接口 可以 用 Lambda表达式简化 */
public class Demo01 {
	public static void main(String[] args) {
		Function function = new Function<String,String>(){
			@Override     
			public String apply(String str){
				return str;
			}
		}
	  ;
		Function function = (str)->{
			return str;
		}
		;
		System.out.println(function.apply("sad"));
	}
}
```



2.Predicate （断定性接口）



```java
import java.util.function.Predicate;
/*    断定型接口，有一个输入参数，返回值只能是布尔值 */
public class Demo2 {
	public static void main(String[] args) {
		//判断字符串是否为空  
		Predicate<String> predicate = new Predicate<String>() {
			@Override            
      public Boolean test(String str) {
				return str.isEmpty();
			}
		}
		;
		Predicate<String> predicate = (str)->{
			return str.isEmpty();
		}
		;
		System.out.println(predicate.test(""));
	}
}
```



3.Consumer 消费型接口：只有输入，没有返回值



4.Supplier 供给型接口：没有参数，只有返回值



### Stream流式计算：



```java
import java.util.Arrays;import java.util.HashMap;import java.util.List;import java.util.Map;import java.util.concurrent.ArrayBlockingQueue;import java.util.concurrent.locks.ReadWriteLock;import java.util.concurrent.locks.ReentrantReadWriteLock;import static org.graalvm.compiler.options.OptionType.User;public class Test {    public static void main(String[] args) {        User u1 = new User(1,"a",21);        User u2 = new User(2,"b",22);        User u3 = new User(3,"c",23);        User u4 = new User(4,"d",24);        User u5 = new User(6,"e",25);        //集合就是存储        List<User> list = Arrays.asList(u1, u2, u3, u4, u5);        //Lambda表达式 链式编程 函数式接口 Stream流式计算        //计算交给Stream流        list.stream()                .filter(u->{return u.getId()%2==0;})                .filter(u->{return u.getAge()>23;})                .map(u->{return u.getName().toUpperCase();})                .sorted((uu1,uu2)->{return uu2.compareTo(uu1);})                .limit(1)                .forEach(System.out::println);    }}class User{    public User(int id, String name, int age) {        this.id = id;        this.name = name;        this.age = age;    }    public int getId() {        return id;    }    public void setId(int id) {        this.id = id;    }    public String getName() {        return name;    }    public void setName(String name) {        this.name = name;    }    public int getAge() {        return age;    }    public void setAge(int age) {        this.age = age;    }    public int id;    public String name;    public int age;    }
```



### ForkJoin:

工作窃取：这个里面维护的都是双端队列



```java
import java.util.concurrent.RecursiveTask;public class ForkJoinDemo extends RecursiveTask<Long> {        private Long start; //1    private Long end;   //1990900000        //临界值    private Long temp = 10000L;        public ForkJoinDemo(Long start,Long end){        this.start=start;        this.end=end;    }        @Override    protected Long compute(){        if((end-start)<temp){            Long sum=0L;            for(Long i=start;i<end;i++){                sum+=i;            }            return sum;        }else{ //forkjoin 递归            long middle = (start+end)/2; //中间值            ForkJoinDemo task1 = new ForkJoinDemo(start,middle);            task1.fork(); //拆分任务，把任务压入线程队列            ForkJoinDemo task2 = new ForkJoinDemo(middle+1,end);            task2.fork();                        return task1.join()+task2.join();                    }            }    }
```



测试：

```java
import java.util.concurrent.ExecutionException;import java.util.concurrent.ForkJoinPool;import java.util.concurrent.ForkJoinTask;import java.util.stream.LongStream;public class Test {    public static void main(String[] args) throws ExecutionException, InterruptedException {        //test1();        //test2();        test3();    }    public static void test1(){        Long sum = 0l;        long start = System.currentTimeMillis();        for (Long i = 1L;i<=10_0000_0000;i++){            sum+=i;        }        long end = System.currentTimeMillis();        System.out.println("sum="+sum+"时间："+(end-start));    }    //会使用ForkJoin    public static void test2() throws ExecutionException, InterruptedException {        long start = System.currentTimeMillis();        ForkJoinPool forkJoinPool = new ForkJoinPool();        ForkJoinTask<Long> task = new ForkJoinDemo(0L,10_0000_0000L);        ForkJoinTask<Long> submit = forkJoinPool.submit(task); //提交任务        Long sum = submit.get();        long end = System.currentTimeMillis();        System.out.println("sum="+sum+"时间："+(end-start));    }    public static void test3(){        long start = System.currentTimeMillis();        //Stream并行流         long sum = LongStream.rangeClosed(0L,10_0000_0000).parallel().reduce(0,Long::sum);                long end=System.currentTimeMillis();        System.out.println("sum="+"时间："+(end-start));            }    }
```



异步回调

```java
package kk;import java.util.concurrent.CompletableFuture;import java.util.concurrent.ExecutionException;import java.util.concurrent.TimeUnit;public class Demo01 {    /*    异步调用：CompletableFuture    //异步执行    //成功回调    //失败回调     */    public static void main(String[] args) throws ExecutionException, InterruptedException {     /*   //发起一个请求        CompletableFuture<Void> completableFuture = CompletableFuture.runAsync(()->{            try {                TimeUnit.SECONDS.sleep(2);            } catch (InterruptedException e) {                e.printStackTrace();            }            System.out.println(Thread.currentThread().getName()+"runAsync=>Void");        });        System.out.println("1111");        completableFuture.get(); //获取阻塞执行结果        }        */    // 有返回值的supplyAsync 异步回调    // ajax 成功和失败的回调        CompletableFuture<Integer> completableFuture = CompletableFuture.supplyAsync(()->{            System.out.println(Thread.currentThread().getName()+"supplyAsync=>VInteger");            return 1024;        });        completableFuture.whenComplete((t,u)->{            System.out.println("t->"+t); //正常的返回结果            System.out.println("u->"+u); //错误信息        }).exceptionally((e)->{            System.out.println(e.getMessage());            return 233; //可以获取到错误的返回结果         }).get();    }}
```







### JMM

Volatile 是Java虚拟机提供轻量级的同步机制

1.保证可见性

2.不保证原子性

3.禁止指令重排



JMM：java内存模型，不存在的东西，属于概念，约定。



关于JMM的一些同步的约定：

1.线程解锁前，必须把共享变量立刻刷回主存

2.线程加锁前，必须读取主存中的最新值到工作内存中

3.加锁和解锁的是用一把锁





```java
package kk;import java.util.concurrent.TimeUnit;public class JMMDemo {    //不加volatile程序会进入死循环！ （保证可见性）    private volatile static int num = 0;    public static void main(String[] args) { // main        new Thread(() -> {            while (num == 0) {            }        }).start();        try {            TimeUnit.SECONDS.sleep(1);        } catch (InterruptedException e) {            e.printStackTrace();        }        num = 1;    }}
```



原子性：不可分割 （而volatile不保证原子性）

​	使用原子类解决原子性问题







单例模式

```java
//饿汉式单例public class Hungry {        //可能会浪费空间    private byte[] data1 = new byte[1024*1024];    private byte[] data2 = new byte[1024*1024];    private byte[] data3 = new byte[1024*1024];    private byte[] data4 = new byte[1024*1024];        private Hungry(){            }  //构造器私有化        private final static Hungry HUNGRY = Hungry();        public static Hungry getInstance(){        return HUNGRY;    }    }
```



懒汉式单例：

```java
public class LazyMan {    private LazyMan(){    }    private volatile static LazyMan lazyMan;        //双重检测锁模式的 懒汉式单例 DCL懒汉式    public static LazyMan getInstance() {        if (lazyMan == null) {            synchronized (LazyMan.class) {                if (lazyMan == null) {                    lazyMan = new LazyMan();  //不是一个原子性操作                    /*   1.分配内存空间                         2.执行构造方法，初始化对象                         3.把这个对象指向这个空间 （如果发生指令重排，会触发错误）                     */                }            }        }            return lazyMan;            }}
```



静态内部类

```java
//静态内部类public class Holder {    private Holder(){    }    public static Holder getInstance(){        return InnerClass.HOLDER;    }        public static class InnerClass{        private static final Holder HOLDER = new Holder();    }    }
```





通过反射破坏懒汉式单例

```java
import java.lang.reflect.Constructor;public class LazyMan {    private LazyMan(){        System.out.println(Thread.currentThread().getName()+"OK");    }    private volatile static LazyMan lazyMan;    //双重检测锁模式的 懒汉式单例 DCL懒汉式    public static LazyMan getInstance() {        if (lazyMan == null) {            synchronized (LazyMan.class) {                if (lazyMan == null) {                    lazyMan = new LazyMan();  //不是一个原子性操作                    /*   1.分配内存空间                         2.执行构造方法，初始化对象                         3.把这个对象指向这个空间 （如果发生指令重排，会触发错误）                     */                }            }        }            return lazyMan;    }    //用反射破坏单例模式    public static void main(String[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, InstantiationException {        LazyMan instance = LazyMan.getInstance();        Constructor<LazyMan> declaredConstructor = LazyMan.class.getDeclaredConstructor(null);        declaredConstructor.setAccessible(true); //无视私有构造器        LazyMan instance2 = declaredConstructor.newInstance();        System.out.println(instance);        System.out.println(instance2);    }        }
```





