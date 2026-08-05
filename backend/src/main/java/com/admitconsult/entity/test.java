package com.admitconsult.entity;

import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
class Pen{}

public class test {

    static public  void main(String... args) {
        new Pen();
        Pen p = new Pen();
        change(p);
        System.out.println("about to end");

    }
    public static void change(Pen pen){
        pen = new Pen();
    }
}
