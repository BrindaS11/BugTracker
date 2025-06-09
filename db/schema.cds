namespace bugtracker;
using { cuid, managed } from '@sap/cds/common';

entity Bug: cuid, managed {
  title: String(255);
  description: String(1000);
  status: Association to Status; 
  priority: Association to Priority; 
  developer: Association to Developer;
}

entity Priority{
    key name: String(50);
    description: String(255);
}

entity Status{
    key name: String(50);
    description: String(255);
}

entity Developer: managed {
  key ID: String(50);
  firstName: String(100);
  lastName: String(100);
  email: String(255);
  bugs: Composition of many Bug on bugs.developer = $self;
}