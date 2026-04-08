namespace Backend.Schemas
{
    public class BookRequest
    {
        public int StaffId { get; set; }
        public DateTime AppointmentTime { get; set; }
        public string Reason { get; set; } = null!;
    }

    public class BookResponse
    {
    }
}
