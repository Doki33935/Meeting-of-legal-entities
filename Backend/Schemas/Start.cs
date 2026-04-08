namespace Backend.Schemas
{
    public class StartRequest
    {
    }

    public class SlotResponse
    {
        public DateTime Slot { get; set; }
        public int Count { get; set; }
    }

    public class AppointmentResponse
    {
        public string StaffImage { get; set; } = null!;
        public string StaffName { get; set; } = null!;
        public string Reason { get; set; } = null!;
        public DateTime AppointmentTime { get; set; }
    }
}
