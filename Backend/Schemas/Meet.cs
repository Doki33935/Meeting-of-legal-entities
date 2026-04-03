namespace Backend.Schemas
{
    public class MeetRequest
    {
        public DateTime Slot { get; set; }
    }

    public class MeetResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int Age { get; set; }
        public string Description { get; set; } = null!;
        public string Image { get; set; } = null!;
    }
}
