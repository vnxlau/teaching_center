Create a list and fix the issues sequentially:
1. testar membership plans
2. em baixo da seccao do mes atual devia estar uma ongoing year section com os cumulativos do ano tal como ja tinhamos discutido anteriormente.
---

Attendance Dashboard
Attendance stats, like assiduity per student, and days with most and less students per weekday, logged max and min per month, per school year.
create a day attendance graph displying the days with the most expected attendance vs the real logged attendance.
expected attendance is calculate based on the scheduled distribution of students per weekday and the real attendance is based on the loggged attendance.

---
Finance
When adding a payment all that should be necessary to input is the student and the month . the rest the system already knows, can you fix it?

Aditionally on the list of payments, make sure the "mark paid" button works. also for overdue allow the option to mark as paid, like we have for pending payments.
For the overdue payment card of the month, please change the color to red and use the overdue emoji like you have done on the line bellow, make sure it filters correclty on the list.
Add a month filter to the list bellow- to filter the payments for a given month.

Student list
Hide the student code from the list item

---

Build a Business Dashboard
Create a page to centralize all financial movements either in (payments) or out (expenses), there we can see all income movements and expenses in the same list, sorted chronologically.
Then inside it have links to the sub pages expenses and payments, and therefore demote the payment and expenses dashboards to a sub page of business dashboard
Make sure the navigation between all is smooth and user friendly
in the sidebar menu you can create a new section for business and put all three pages in there.


---

fix issues with lint:
./src/app/admin/attendance-dashboard/page.tsx
107:6  Warning: React Hook useEffect has missing dependencies: 'fetchAttendanceStats' and 'router'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps

./src/app/admin/business/expenses/page.tsx
100:6  Warning: React Hook useEffect has missing dependencies: 'fetchExpenses', 'fetchStats', and 'router'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps

./src/app/admin/business/page.tsx
68:6  Warning: React Hook useEffect has missing dependencies: 'fetchMovements' and 'router'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps

./src/app/parent/students/[id]/page.tsx
76:6  Warning: React Hook useEffect has missing dependencies: 'fetchAttendanceData', 'fetchStudentData', and 'fetchStudentSchedule'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps


---
Parents dashboard
the parent list doesn't work the view button does nothing- add a sub page to open Parent information, similar to what we have for the student.
for the parents just add the details, the list of children on the right and their active membership plan and bellow add the list of payments from that parent, on the rright bellow the children list and Parent notes, to log notes on a parent. similar to what we implemented for the student.

add feature on the sidebar menu to hightlight the menu we are currently on

---
Student dashboard
Add a profile photo before student name
allow the user to upload the students profile photo to it's file in his specific page
