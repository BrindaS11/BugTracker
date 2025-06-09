using bugtracker from '../db/schema';

service BugService {
  entity Bugs as projection on bugtracker.Bug;
  entity Priorities as projection on bugtracker.Priority;
  entity Statuses as projection on bugtracker.Status;
  entity Developers as projection on bugtracker.Developer;
}